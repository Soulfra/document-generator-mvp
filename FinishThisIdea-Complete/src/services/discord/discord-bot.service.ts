/**
 * Discord Bot Service
 * Adapted from Soulfra-AgentZero's discord-bot.js
 * Provides community engagement, gamification, and user interaction
 */

import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, Interaction, TextChannel } from 'discord.js';
import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import { logger } from '../../utils/logger';
import { GamificationService } from '../gamification/gamification.service';
import { AIService } from '../ai/ai.service';
import { PaymentService } from '../payment/payment.service';
import { EmailQueueService } from '../email/email-queue.service';

interface DiscordConfig {
  botToken: string;
  commandPrefix: string;
  guildId?: string;
  channels?: {
    welcome?: string;
    announcements?: string;
    support?: string;
    showcase?: string;
  };
}

interface UserStats {
  userId: string;
  discordId: string;
  username: string;
  balance: number;
  level: number;
  xp: number;
  projectsCreated: number;
  codeAnalyzed: number;
  lastDaily?: Date;
  reputation: number;
}

export class DiscordBotService extends EventEmitter {
  private client: Client;
  private prisma: PrismaClient;
  private gamificationService: GamificationService;
  private aiService: AIService;
  private paymentService: PaymentService;
  private emailQueue: EmailQueueService;
  private config: DiscordConfig;
  private commands: Map<string, Function>;
  private cooldowns: Map<string, Map<string, number>>;

  constructor(config: DiscordConfig) {
    super();
    
    this.config = config;
    this.prisma = new PrismaClient();
    this.gamificationService = new GamificationService();
    this.aiService = new AIService();
    this.paymentService = new PaymentService();
    this.emailQueue = new EmailQueueService();
    
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
      ]
    });
    
    this.commands = new Map();
    this.cooldowns = new Map();
    
    this.setupCommands();
    this.setupEventHandlers();
  }

  /**
   * Start the Discord bot
   */
  async start(): Promise<void> {
    try {
      await this.client.login(this.config.botToken);
      logger.info('Discord bot started successfully');
    } catch (error) {
      logger.error('Failed to start Discord bot', error);
      throw error;
    }
  }

  /**
   * Setup command handlers
   */
  private setupCommands(): void {
    // Help & Information
    this.commands.set('help', this.helpCommand.bind(this));
    this.commands.set('commands', this.helpCommand.bind(this));
    
    // User Management
    this.commands.set('register', this.registerCommand.bind(this));
    this.commands.set('profile', this.profileCommand.bind(this));
    this.commands.set('balance', this.balanceCommand.bind(this));
    
    // Code & Projects
    this.commands.set('analyze', this.analyzeCommand.bind(this));
    this.commands.set('cleanup', this.cleanupCommand.bind(this));
    this.commands.set('showcase', this.showcaseCommand.bind(this));
    
    // Gamification
    this.commands.set('daily', this.dailyBonusCommand.bind(this));
    this.commands.set('leaderboard', this.leaderboardCommand.bind(this));
    this.commands.set('achievements', this.achievementsCommand.bind(this));
    this.commands.set('level', this.levelCommand.bind(this));
    
    // AI & Agents
    this.commands.set('ai', this.aiCommand.bind(this));
    this.commands.set('agent', this.agentCommand.bind(this));
    
    // Economy
    this.commands.set('shop', this.shopCommand.bind(this));
    this.commands.set('buy', this.buyCommand.bind(this));
    this.commands.set('transfer', this.transferCommand.bind(this));
    
    // Stats & Info
    this.commands.set('stats', this.statsCommand.bind(this));
    this.commands.set('pricing', this.pricingCommand.bind(this));
    this.commands.set('api', this.apiInfoCommand.bind(this));
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.client.on('ready', () => {
      logger.info(`Discord bot logged in as ${this.client.user?.tag}`);
      this.setActivity();
      setInterval(() => this.setActivity(), 300000); // Update every 5 minutes
    });

    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;
      
      const prefix = this.config.commandPrefix;
      if (!message.content.startsWith(prefix)) return;

      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const commandName = args.shift()?.toLowerCase();
      
      if (!commandName) return;

      const command = this.commands.get(commandName);
      if (command) {
        // Check cooldown
        if (this.isOnCooldown(message.author.id, commandName)) {
          await message.reply('⏱️ Please wait before using this command again.');
          return;
        }

        try {
          await command(message, args);
          this.setCooldown(message.author.id, commandName);
        } catch (error) {
          logger.error(`Error executing command ${commandName}`, error);
          await message.reply('❌ An error occurred while executing the command.');
        }
      }
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      try {
        await this.handleButtonInteraction(interaction);
      } catch (error) {
        logger.error('Error handling button interaction', error);
        await interaction.reply({ 
          content: '❌ An error occurred while processing your request.', 
          ephemeral: true 
        });
      }
    });

    this.client.on('guildMemberAdd', async (member) => {
      await this.handleNewMember(member);
    });
  }

  /**
   * Set bot activity status
   */
  private async setActivity(): Promise<void> {
    try {
      const stats = await this.getGlobalStats();
      this.client.user?.setActivity(
        `${stats.totalUsers} users | ${stats.projectsAnalyzed} projects`, 
        { type: 3 } // Watching
      );
    } catch (error) {
      logger.error('Error setting bot activity', error);
    }
  }

  /**
   * Command: Help
   */
  private async helpCommand(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor(0x007bff)
      .setTitle('🚀 FinishThisIdea Bot Commands')
      .setDescription('AI-powered code cleanup and collaboration platform')
      .addFields(
        { 
          name: '👤 User Commands', 
          value: '`!register` - Register your account\n`!profile` - View your profile\n`!balance` - Check your token balance',
          inline: true
        },
        { 
          name: '💻 Code Commands', 
          value: '`!analyze <code/url>` - Analyze code\n`!cleanup <code/url>` - Clean up code\n`!showcase <project>` - Share project',
          inline: true
        },
        { 
          name: '🎮 Gamification', 
          value: '`!daily` - Claim daily bonus\n`!leaderboard` - Top users\n`!achievements` - Your achievements\n`!level` - Level progress',
          inline: true
        },
        { 
          name: '🤖 AI Commands', 
          value: '`!ai <question>` - Ask AI\n`!agent list` - Available agents\n`!agent create` - Create agent',
          inline: true
        },
        { 
          name: '💰 Economy', 
          value: '`!shop` - View shop items\n`!buy <item>` - Purchase item\n`!transfer @user <amount>` - Send tokens',
          inline: true
        },
        { 
          name: '📊 Information', 
          value: '`!stats` - Platform statistics\n`!pricing` - View pricing tiers\n`!api` - API information',
          inline: true
        }
      )
      .setTimestamp()
      .setFooter({ 
        text: 'FinishThisIdea', 
        iconURL: this.client.user?.displayAvatarURL() 
      });

    await message.reply({ embeds: [embed] });
  }

  /**
   * Command: Register
   */
  private async registerCommand(message: Message): Promise<void> {
    const discordId = message.author.id;
    const username = message.author.username;

    try {
      // Check if already registered
      const existingUser = await this.getUserByDiscordId(discordId);
      if (existingUser) {
        await message.reply('✅ You are already registered!');
        return;
      }

      // Create user
      const user = await this.createUser({
        username,
        discordId,
        email: `${discordId}@discord.finishthisidea.com`
      });

      // Send welcome message
      const embed = new EmbedBuilder()
        .setColor(0x28a745)
        .setTitle('🎉 Registration Successful!')
        .setDescription(`Welcome to FinishThisIdea, ${username}!`)
        .addFields(
          { name: '🎁 Welcome Bonus', value: '100 tokens', inline: true },
          { name: '📈 Starting Level', value: 'Level 1', inline: true },
          { name: '🏆 First Achievement', value: 'Early Adopter', inline: true }
        )
        .setThumbnail(message.author.displayAvatarURL())
        .setTimestamp();

      // Add buttons
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('claim_welcome_bonus')
            .setLabel('Claim Welcome Bonus')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎁'),
          new ButtonBuilder()
            .setCustomId('view_tutorial')
            .setLabel('View Tutorial')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📚')
        );

      await message.reply({ embeds: [embed], components: [row] });

      // Track registration
      await this.gamificationService.trackAction(user.id, 'user.register');
      
      // Queue welcome email
      await this.emailQueue.queueWelcomeSequence(
        user.id,
        user.email,
        username
      );
    } catch (error) {
      logger.error('Error in register command', error);
      await message.reply('❌ Registration failed. Please try again.');
    }
  }

  /**
   * Command: Profile
   */
  private async profileCommand(message: Message): Promise<void> {
    const user = await this.getUserByDiscordId(message.author.id);
    if (!user) {
      await message.reply('❌ You need to register first! Use `!register`');
      return;
    }

    const stats = await this.getUserStats(user.id);
    const progress = await this.gamificationService.getUserProgress(user.id);

    const embed = new EmbedBuilder()
      .setColor(0x667eea)
      .setTitle(`${message.author.username}'s Profile`)
      .setThumbnail(message.author.displayAvatarURL())
      .addFields(
        { name: '📊 Level', value: `Level ${progress.level}`, inline: true },
        { name: '⭐ XP', value: `${progress.xp} XP`, inline: true },
        { name: '💰 Tokens', value: `${progress.tokens} tokens`, inline: true },
        { name: '📁 Projects', value: stats.projectsCreated.toString(), inline: true },
        { name: '🔍 Code Analyzed', value: stats.codeAnalyzed.toString(), inline: true },
        { name: '🏆 Achievements', value: progress.achievements.length.toString(), inline: true }
      )
      .setFooter({ text: `Member since ${new Date(user.created).toLocaleDateString()}` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  /**
   * Command: Analyze Code
   */
  private async analyzeCommand(message: Message, args: string[]): Promise<void> {
    const user = await this.ensureRegistered(message);
    if (!user) return;

    if (args.length === 0) {
      await message.reply('❌ Please provide code or a GitHub URL to analyze.');
      return;
    }

    const input = args.join(' ');
    
    // Send processing message
    const processingMsg = await message.reply('🔍 Analyzing your code...');

    try {
      // Determine if input is URL or code
      const isUrl = input.startsWith('http');
      let code = input;
      let language = 'javascript'; // Default

      if (isUrl) {
        // Fetch code from URL (simplified)
        code = await this.fetchCodeFromUrl(input);
      }

      // Analyze code
      const analysis = await this.aiService.analyzeCode({
        code,
        language,
        userId: user.id
      });

      // Create result embed
      const embed = new EmbedBuilder()
        .setColor(0x17a2b8)
        .setTitle('📊 Code Analysis Results')
        .addFields(
          { name: '🎯 Quality Score', value: `${analysis.qualityScore}/100`, inline: true },
          { name: '🐛 Issues Found', value: analysis.issues.toString(), inline: true },
          { name: '💡 Suggestions', value: analysis.suggestions.length.toString(), inline: true }
        )
        .setDescription(analysis.summary.substring(0, 200) + '...')
        .setTimestamp();

      // Add action buttons
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`cleanup_${analysis.id}`)
            .setLabel('Clean Up Code')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🧹'),
          new ButtonBuilder()
            .setCustomId(`details_${analysis.id}`)
            .setLabel('View Details')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📋')
        );

      await processingMsg.edit({ content: null, embeds: [embed], components: [row] });

      // Track action and award XP
      await this.gamificationService.trackAction(user.id, 'code.analyze');
    } catch (error) {
      logger.error('Error in analyze command', error);
      await processingMsg.edit('❌ Failed to analyze code. Please try again.');
    }
  }

  /**
   * Command: Daily Bonus
   */
  private async dailyBonusCommand(message: Message): Promise<void> {
    const user = await this.ensureRegistered(message);
    if (!user) return;

    const stats = await this.getUserStats(user.id);
    
    // Check if already claimed today
    if (stats.lastDaily && this.isSameDay(stats.lastDaily, new Date())) {
      const nextDaily = new Date(stats.lastDaily);
      nextDaily.setDate(nextDaily.getDate() + 1);
      nextDaily.setHours(0, 0, 0, 0);
      
      const timeLeft = nextDaily.getTime() - Date.now();
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      
      await message.reply(`⏰ Daily bonus already claimed! Come back in ${hours}h ${minutes}m`);
      return;
    }

    // Calculate streak
    let streak = 1;
    if (stats.lastDaily) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (this.isSameDay(stats.lastDaily, yesterday)) {
        streak = (stats.streak || 0) + 1;
      }
    }

    // Calculate bonus
    const baseBonus = 50;
    const streakBonus = Math.min(streak * 10, 100);
    const totalBonus = baseBonus + streakBonus;

    // Award bonus
    await this.updateUserStats(user.id, {
      lastDaily: new Date(),
      streak,
      tokens: stats.tokens + totalBonus
    });

    // Track action
    await this.gamificationService.trackAction(user.id, 'daily.login', streak);

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🎁 Daily Bonus Claimed!')
      .addFields(
        { name: '💰 Base Bonus', value: `${baseBonus} tokens`, inline: true },
        { name: '🔥 Streak Bonus', value: `${streakBonus} tokens`, inline: true },
        { name: '💎 Total', value: `${totalBonus} tokens`, inline: true }
      )
      .setDescription(`Current streak: ${streak} days`)
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  /**
   * Command: Leaderboard
   */
  private async leaderboardCommand(message: Message): Promise<void> {
    const leaderboard = await this.gamificationService.getLeaderboard('xp', 10);

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🏆 FinishThisIdea Leaderboard')
      .setDescription('Top 10 users by XP')
      .setTimestamp();

    const fields = leaderboard.map((entry, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      return {
        name: `${medal} ${entry.username}`,
        value: `Level ${entry.level} • ${entry.score} XP`,
        inline: false
      };
    });

    embed.addFields(fields);

    await message.reply({ embeds: [embed] });
  }

  /**
   * Handle button interactions
   */
  private async handleButtonInteraction(interaction: Interaction): Promise<void> {
    if (!interaction.isButton()) return;

    const customId = interaction.customId;

    if (customId === 'claim_welcome_bonus') {
      await interaction.reply({
        content: '🎁 Welcome bonus of 100 tokens has been added to your account!',
        ephemeral: true
      });
    } else if (customId === 'view_tutorial') {
      await interaction.reply({
        content: '📚 Check out our tutorial at https://docs.finishthisidea.com/tutorial',
        ephemeral: true
      });
    } else if (customId.startsWith('cleanup_')) {
      const analysisId = customId.replace('cleanup_', '');
      await interaction.reply({
        content: `🧹 Starting code cleanup... Visit https://app.finishthisidea.com/cleanup/${analysisId}`,
        ephemeral: true
      });
    }
  }

  /**
   * Handle new member join
   */
  private async handleNewMember(member: any): Promise<void> {
    if (!this.config.channels?.welcome) return;

    const channel = member.guild.channels.cache.get(this.config.channels.welcome) as TextChannel;
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(0x28a745)
      .setTitle('👋 Welcome to FinishThisIdea!')
      .setDescription(`Welcome ${member}, we're glad you're here!`)
      .addFields(
        { name: '🚀 Get Started', value: 'Use `!register` to create your account', inline: true },
        { name: '❓ Need Help?', value: 'Use `!help` to see all commands', inline: true }
      )
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  }

  /**
   * Helper methods
   */
  private async ensureRegistered(message: Message): Promise<any> {
    const user = await this.getUserByDiscordId(message.author.id);
    if (!user) {
      await message.reply('❌ You need to register first! Use `!register`');
      return null;
    }
    return user;
  }

  private async getUserByDiscordId(discordId: string): Promise<any> {
    // In production, query from database
    return null;
  }

  private async createUser(data: any): Promise<any> {
    // In production, create in database
    return { id: 'user-' + Date.now(), ...data, created: new Date() };
  }

  private async getUserStats(userId: string): Promise<UserStats> {
    // In production, fetch from database
    return {
      userId,
      discordId: '',
      username: '',
      balance: 100,
      level: 1,
      xp: 0,
      projectsCreated: 0,
      codeAnalyzed: 0,
      reputation: 0
    };
  }

  private async updateUserStats(userId: string, updates: Partial<UserStats>): Promise<void> {
    // In production, update in database
  }

  private async getGlobalStats(): Promise<any> {
    // In production, aggregate from database
    return {
      totalUsers: 1234,
      projectsAnalyzed: 5678
    };
  }

  private async fetchCodeFromUrl(url: string): Promise<string> {
    // In production, fetch from GitHub/GitLab
    return '// Sample code';
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  private isOnCooldown(userId: string, command: string): boolean {
    const userCooldowns = this.cooldowns.get(userId);
    if (!userCooldowns) return false;
    
    const cooldownEnd = userCooldowns.get(command);
    if (!cooldownEnd) return false;
    
    return Date.now() < cooldownEnd;
  }

  private setCooldown(userId: string, command: string, duration: number = 3000): void {
    if (!this.cooldowns.has(userId)) {
      this.cooldowns.set(userId, new Map());
    }
    
    const userCooldowns = this.cooldowns.get(userId)!;
    userCooldowns.set(command, Date.now() + duration);
  }

  /**
   * Additional commands implementation
   */
  private async aiCommand(message: Message, args: string[]): Promise<void> {
    const user = await this.ensureRegistered(message);
    if (!user) return;

    if (args.length === 0) {
      await message.reply('❌ Please provide a question for the AI.');
      return;
    }

    const question = args.join(' ');
    const typing = message.channel.sendTyping();

    try {
      const response = await this.aiService.query({
        prompt: question,
        userId: user.id,
        context: 'discord'
      });

      const embed = new EmbedBuilder()
        .setColor(0x667eea)
        .setTitle('🤖 AI Response')
        .setDescription(response.substring(0, 2000))
        .setFooter({ text: 'Powered by FinishThisIdea AI' })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error in AI command', error);
      await message.reply('❌ Failed to get AI response. Please try again.');
    }
  }

  private async shopCommand(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor(0x28a745)
      .setTitle('🛍️ FinishThisIdea Shop')
      .setDescription('Spend your tokens on these items!')
      .addFields(
        { 
          name: '🎯 Code Analysis Boost (100 tokens)', 
          value: 'Get 2x XP from code analysis for 24 hours',
          inline: false
        },
        { 
          name: '⚡ Priority Queue (200 tokens)', 
          value: 'Skip the queue for faster processing',
          inline: false
        },
        { 
          name: '🎨 Custom Badge (500 tokens)', 
          value: 'Design your own profile badge',
          inline: false
        },
        { 
          name: '🚀 API Credits (50 tokens)', 
          value: 'Get 1000 additional API calls',
          inline: false
        }
      )
      .setFooter({ text: 'Use !buy <item-name> to purchase' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  private async statsCommand(message: Message): Promise<void> {
    const stats = await this.getGlobalStats();

    const embed = new EmbedBuilder()
      .setColor(0x17a2b8)
      .setTitle('📊 FinishThisIdea Statistics')
      .addFields(
        { name: '👥 Total Users', value: stats.totalUsers.toLocaleString(), inline: true },
        { name: '📁 Projects Analyzed', value: stats.projectsAnalyzed.toLocaleString(), inline: true },
        { name: '💻 Code Cleaned', value: (stats.codeCleanedMB || 0).toLocaleString() + ' MB', inline: true },
        { name: '🏆 Achievements Unlocked', value: (stats.achievementsUnlocked || 0).toLocaleString(), inline: true },
        { name: '💰 Tokens in Circulation', value: (stats.tokensCirculation || 0).toLocaleString(), inline: true },
        { name: '🤖 AI Queries', value: (stats.aiQueries || 0).toLocaleString(), inline: true }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  private async pricingCommand(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('💎 FinishThisIdea Pricing')
      .setDescription('Choose the plan that fits your needs')
      .addFields(
        { 
          name: '🆓 Free Tier', 
          value: '• 5 code analyses/day\n• Basic AI assistance\n• Community support',
          inline: true
        },
        { 
          name: '💵 Developer ($5/mo)', 
          value: '• Unlimited analyses\n• Advanced AI models\n• Priority support\n• API access',
          inline: true
        },
        { 
          name: '💰 Team ($25/mo)', 
          value: '• Everything in Developer\n• Team collaboration\n• Custom profiles\n• White-label options',
          inline: true
        }
      )
      .setFooter({ text: 'Visit finishthisidea.com/pricing for more details' })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }

  private async apiInfoCommand(message: Message): Promise<void> {
    const user = await this.getUserByDiscordId(message.author.id);
    
    const embed = new EmbedBuilder()
      .setColor(0x007bff)
      .setTitle('🔌 API Information')
      .setDescription('Access FinishThisIdea programmatically')
      .addFields(
        { 
          name: '📍 Base URL', 
          value: '`https://api.finishthisidea.com/v1`',
          inline: false
        },
        { 
          name: '🔑 Authentication', 
          value: 'Use Bearer token in Authorization header',
          inline: false
        },
        { 
          name: '📚 Documentation', 
          value: '[View Full Docs](https://docs.finishthisidea.com/api)',
          inline: false
        }
      );

    if (user) {
      embed.addFields({
        name: '🎫 Your API Key',
        value: 'Generate at [dashboard.finishthisidea.com](https://dashboard.finishthisidea.com)',
        inline: false
      });
    }

    await message.reply({ embeds: [embed] });
  }

  // More commands can be added...
}