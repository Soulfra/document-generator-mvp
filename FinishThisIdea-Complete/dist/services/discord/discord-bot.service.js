"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordBotService = void 0;
const discord_js_1 = require("discord.js");
const events_1 = require("events");
const client_1 = require("@prisma/client");
const logger_1 = require("../../utils/logger");
const gamification_service_1 = require("../gamification/gamification.service");
const ai_service_1 = require("../ai/ai.service");
const payment_service_1 = require("../payment/payment.service");
const email_queue_service_1 = require("../email/email-queue.service");
class DiscordBotService extends events_1.EventEmitter {
    client;
    prisma;
    gamificationService;
    aiService;
    paymentService;
    emailQueue;
    config;
    commands;
    cooldowns;
    constructor(config) {
        super();
        this.config = config;
        this.prisma = new client_1.PrismaClient();
        this.gamificationService = new gamification_service_1.GamificationService();
        this.aiService = new ai_service_1.AIService();
        this.paymentService = new payment_service_1.PaymentService();
        this.emailQueue = new email_queue_service_1.EmailQueueService();
        this.client = new discord_js_1.Client({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.MessageContent,
                discord_js_1.GatewayIntentBits.GuildMembers,
                discord_js_1.GatewayIntentBits.DirectMessages
            ]
        });
        this.commands = new Map();
        this.cooldowns = new Map();
        this.setupCommands();
        this.setupEventHandlers();
    }
    async start() {
        try {
            await this.client.login(this.config.botToken);
            logger_1.logger.info('Discord bot started successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to start Discord bot', error);
            throw error;
        }
    }
    setupCommands() {
        this.commands.set('help', this.helpCommand.bind(this));
        this.commands.set('commands', this.helpCommand.bind(this));
        this.commands.set('register', this.registerCommand.bind(this));
        this.commands.set('profile', this.profileCommand.bind(this));
        this.commands.set('balance', this.balanceCommand.bind(this));
        this.commands.set('analyze', this.analyzeCommand.bind(this));
        this.commands.set('cleanup', this.cleanupCommand.bind(this));
        this.commands.set('showcase', this.showcaseCommand.bind(this));
        this.commands.set('daily', this.dailyBonusCommand.bind(this));
        this.commands.set('leaderboard', this.leaderboardCommand.bind(this));
        this.commands.set('achievements', this.achievementsCommand.bind(this));
        this.commands.set('level', this.levelCommand.bind(this));
        this.commands.set('ai', this.aiCommand.bind(this));
        this.commands.set('agent', this.agentCommand.bind(this));
        this.commands.set('shop', this.shopCommand.bind(this));
        this.commands.set('buy', this.buyCommand.bind(this));
        this.commands.set('transfer', this.transferCommand.bind(this));
        this.commands.set('stats', this.statsCommand.bind(this));
        this.commands.set('pricing', this.pricingCommand.bind(this));
        this.commands.set('api', this.apiInfoCommand.bind(this));
    }
    setupEventHandlers() {
        this.client.on('ready', () => {
            logger_1.logger.info(`Discord bot logged in as ${this.client.user?.tag}`);
            this.setActivity();
            setInterval(() => this.setActivity(), 300000);
        });
        this.client.on('messageCreate', async (message) => {
            if (message.author.bot)
                return;
            const prefix = this.config.commandPrefix;
            if (!message.content.startsWith(prefix))
                return;
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift()?.toLowerCase();
            if (!commandName)
                return;
            const command = this.commands.get(commandName);
            if (command) {
                if (this.isOnCooldown(message.author.id, commandName)) {
                    await message.reply('⏱️ Please wait before using this command again.');
                    return;
                }
                try {
                    await command(message, args);
                    this.setCooldown(message.author.id, commandName);
                }
                catch (error) {
                    logger_1.logger.error(`Error executing command ${commandName}`, error);
                    await message.reply('❌ An error occurred while executing the command.');
                }
            }
        });
        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton())
                return;
            try {
                await this.handleButtonInteraction(interaction);
            }
            catch (error) {
                logger_1.logger.error('Error handling button interaction', error);
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
    async setActivity() {
        try {
            const stats = await this.getGlobalStats();
            this.client.user?.setActivity(`${stats.totalUsers} users | ${stats.projectsAnalyzed} projects`, { type: 3 });
        }
        catch (error) {
            logger_1.logger.error('Error setting bot activity', error);
        }
    }
    async helpCommand(message) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x007bff)
            .setTitle('🚀 FinishThisIdea Bot Commands')
            .setDescription('AI-powered code cleanup and collaboration platform')
            .addFields({
            name: '👤 User Commands',
            value: '`!register` - Register your account\n`!profile` - View your profile\n`!balance` - Check your token balance',
            inline: true
        }, {
            name: '💻 Code Commands',
            value: '`!analyze <code/url>` - Analyze code\n`!cleanup <code/url>` - Clean up code\n`!showcase <project>` - Share project',
            inline: true
        }, {
            name: '🎮 Gamification',
            value: '`!daily` - Claim daily bonus\n`!leaderboard` - Top users\n`!achievements` - Your achievements\n`!level` - Level progress',
            inline: true
        }, {
            name: '🤖 AI Commands',
            value: '`!ai <question>` - Ask AI\n`!agent list` - Available agents\n`!agent create` - Create agent',
            inline: true
        }, {
            name: '💰 Economy',
            value: '`!shop` - View shop items\n`!buy <item>` - Purchase item\n`!transfer @user <amount>` - Send tokens',
            inline: true
        }, {
            name: '📊 Information',
            value: '`!stats` - Platform statistics\n`!pricing` - View pricing tiers\n`!api` - API information',
            inline: true
        })
            .setTimestamp()
            .setFooter({
            text: 'FinishThisIdea',
            iconURL: this.client.user?.displayAvatarURL()
        });
        await message.reply({ embeds: [embed] });
    }
    async registerCommand(message) {
        const discordId = message.author.id;
        const username = message.author.username;
        try {
            const existingUser = await this.getUserByDiscordId(discordId);
            if (existingUser) {
                await message.reply('✅ You are already registered!');
                return;
            }
            const user = await this.createUser({
                username,
                discordId,
                email: `${discordId}@discord.finishthisidea.com`
            });
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x28a745)
                .setTitle('🎉 Registration Successful!')
                .setDescription(`Welcome to FinishThisIdea, ${username}!`)
                .addFields({ name: '🎁 Welcome Bonus', value: '100 tokens', inline: true }, { name: '📈 Starting Level', value: 'Level 1', inline: true }, { name: '🏆 First Achievement', value: 'Early Adopter', inline: true })
                .setThumbnail(message.author.displayAvatarURL())
                .setTimestamp();
            const row = new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('claim_welcome_bonus')
                .setLabel('Claim Welcome Bonus')
                .setStyle(discord_js_1.ButtonStyle.Success)
                .setEmoji('🎁'), new discord_js_1.ButtonBuilder()
                .setCustomId('view_tutorial')
                .setLabel('View Tutorial')
                .setStyle(discord_js_1.ButtonStyle.Primary)
                .setEmoji('📚'));
            await message.reply({ embeds: [embed], components: [row] });
            await this.gamificationService.trackAction(user.id, 'user.register');
            await this.emailQueue.queueWelcomeSequence(user.id, user.email, username);
        }
        catch (error) {
            logger_1.logger.error('Error in register command', error);
            await message.reply('❌ Registration failed. Please try again.');
        }
    }
    async profileCommand(message) {
        const user = await this.getUserByDiscordId(message.author.id);
        if (!user) {
            await message.reply('❌ You need to register first! Use `!register`');
            return;
        }
        const stats = await this.getUserStats(user.id);
        const progress = await this.gamificationService.getUserProgress(user.id);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x667eea)
            .setTitle(`${message.author.username}'s Profile`)
            .setThumbnail(message.author.displayAvatarURL())
            .addFields({ name: '📊 Level', value: `Level ${progress.level}`, inline: true }, { name: '⭐ XP', value: `${progress.xp} XP`, inline: true }, { name: '💰 Tokens', value: `${progress.tokens} tokens`, inline: true }, { name: '📁 Projects', value: stats.projectsCreated.toString(), inline: true }, { name: '🔍 Code Analyzed', value: stats.codeAnalyzed.toString(), inline: true }, { name: '🏆 Achievements', value: progress.achievements.length.toString(), inline: true })
            .setFooter({ text: `Member since ${new Date(user.created).toLocaleDateString()}` })
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    }
    async analyzeCommand(message, args) {
        const user = await this.ensureRegistered(message);
        if (!user)
            return;
        if (args.length === 0) {
            await message.reply('❌ Please provide code or a GitHub URL to analyze.');
            return;
        }
        const input = args.join(' ');
        const processingMsg = await message.reply('🔍 Analyzing your code...');
        try {
            const isUrl = input.startsWith('http');
            let code = input;
            let language = 'javascript';
            if (isUrl) {
                code = await this.fetchCodeFromUrl(input);
            }
            const analysis = await this.aiService.analyzeCode({
                code,
                language,
                userId: user.id
            });
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x17a2b8)
                .setTitle('📊 Code Analysis Results')
                .addFields({ name: '🎯 Quality Score', value: `${analysis.qualityScore}/100`, inline: true }, { name: '🐛 Issues Found', value: analysis.issues.toString(), inline: true }, { name: '💡 Suggestions', value: analysis.suggestions.length.toString(), inline: true })
                .setDescription(analysis.summary.substring(0, 200) + '...')
                .setTimestamp();
            const row = new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId(`cleanup_${analysis.id}`)
                .setLabel('Clean Up Code')
                .setStyle(discord_js_1.ButtonStyle.Primary)
                .setEmoji('🧹'), new discord_js_1.ButtonBuilder()
                .setCustomId(`details_${analysis.id}`)
                .setLabel('View Details')
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setEmoji('📋'));
            await processingMsg.edit({ content: null, embeds: [embed], components: [row] });
            await this.gamificationService.trackAction(user.id, 'code.analyze');
        }
        catch (error) {
            logger_1.logger.error('Error in analyze command', error);
            await processingMsg.edit('❌ Failed to analyze code. Please try again.');
        }
    }
    async dailyBonusCommand(message) {
        const user = await this.ensureRegistered(message);
        if (!user)
            return;
        const stats = await this.getUserStats(user.id);
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
        let streak = 1;
        if (stats.lastDaily) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (this.isSameDay(stats.lastDaily, yesterday)) {
                streak = (stats.streak || 0) + 1;
            }
        }
        const baseBonus = 50;
        const streakBonus = Math.min(streak * 10, 100);
        const totalBonus = baseBonus + streakBonus;
        await this.updateUserStats(user.id, {
            lastDaily: new Date(),
            streak,
            tokens: stats.tokens + totalBonus
        });
        await this.gamificationService.trackAction(user.id, 'daily.login', streak);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xffd700)
            .setTitle('🎁 Daily Bonus Claimed!')
            .addFields({ name: '💰 Base Bonus', value: `${baseBonus} tokens`, inline: true }, { name: '🔥 Streak Bonus', value: `${streakBonus} tokens`, inline: true }, { name: '💎 Total', value: `${totalBonus} tokens`, inline: true })
            .setDescription(`Current streak: ${streak} days`)
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    }
    async leaderboardCommand(message) {
        const leaderboard = await this.gamificationService.getLeaderboard('xp', 10);
        const embed = new discord_js_1.EmbedBuilder()
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
    async handleButtonInteraction(interaction) {
        if (!interaction.isButton())
            return;
        const customId = interaction.customId;
        if (customId === 'claim_welcome_bonus') {
            await interaction.reply({
                content: '🎁 Welcome bonus of 100 tokens has been added to your account!',
                ephemeral: true
            });
        }
        else if (customId === 'view_tutorial') {
            await interaction.reply({
                content: '📚 Check out our tutorial at https://docs.finishthisidea.com/tutorial',
                ephemeral: true
            });
        }
        else if (customId.startsWith('cleanup_')) {
            const analysisId = customId.replace('cleanup_', '');
            await interaction.reply({
                content: `🧹 Starting code cleanup... Visit https://app.finishthisidea.com/cleanup/${analysisId}`,
                ephemeral: true
            });
        }
    }
    async handleNewMember(member) {
        if (!this.config.channels?.welcome)
            return;
        const channel = member.guild.channels.cache.get(this.config.channels.welcome);
        if (!channel)
            return;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x28a745)
            .setTitle('👋 Welcome to FinishThisIdea!')
            .setDescription(`Welcome ${member}, we're glad you're here!`)
            .addFields({ name: '🚀 Get Started', value: 'Use `!register` to create your account', inline: true }, { name: '❓ Need Help?', value: 'Use `!help` to see all commands', inline: true })
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();
        await channel.send({ embeds: [embed] });
    }
    async ensureRegistered(message) {
        const user = await this.getUserByDiscordId(message.author.id);
        if (!user) {
            await message.reply('❌ You need to register first! Use `!register`');
            return null;
        }
        return user;
    }
    async getUserByDiscordId(discordId) {
        return null;
    }
    async createUser(data) {
        return { id: 'user-' + Date.now(), ...data, created: new Date() };
    }
    async getUserStats(userId) {
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
    async updateUserStats(userId, updates) {
    }
    async getGlobalStats() {
        return {
            totalUsers: 1234,
            projectsAnalyzed: 5678
        };
    }
    async fetchCodeFromUrl(url) {
        return '// Sample code';
    }
    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }
    isOnCooldown(userId, command) {
        const userCooldowns = this.cooldowns.get(userId);
        if (!userCooldowns)
            return false;
        const cooldownEnd = userCooldowns.get(command);
        if (!cooldownEnd)
            return false;
        return Date.now() < cooldownEnd;
    }
    setCooldown(userId, command, duration = 3000) {
        if (!this.cooldowns.has(userId)) {
            this.cooldowns.set(userId, new Map());
        }
        const userCooldowns = this.cooldowns.get(userId);
        userCooldowns.set(command, Date.now() + duration);
    }
    async aiCommand(message, args) {
        const user = await this.ensureRegistered(message);
        if (!user)
            return;
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
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x667eea)
                .setTitle('🤖 AI Response')
                .setDescription(response.substring(0, 2000))
                .setFooter({ text: 'Powered by FinishThisIdea AI' })
                .setTimestamp();
            await message.reply({ embeds: [embed] });
        }
        catch (error) {
            logger_1.logger.error('Error in AI command', error);
            await message.reply('❌ Failed to get AI response. Please try again.');
        }
    }
    async shopCommand(message) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x28a745)
            .setTitle('🛍️ FinishThisIdea Shop')
            .setDescription('Spend your tokens on these items!')
            .addFields({
            name: '🎯 Code Analysis Boost (100 tokens)',
            value: 'Get 2x XP from code analysis for 24 hours',
            inline: false
        }, {
            name: '⚡ Priority Queue (200 tokens)',
            value: 'Skip the queue for faster processing',
            inline: false
        }, {
            name: '🎨 Custom Badge (500 tokens)',
            value: 'Design your own profile badge',
            inline: false
        }, {
            name: '🚀 API Credits (50 tokens)',
            value: 'Get 1000 additional API calls',
            inline: false
        })
            .setFooter({ text: 'Use !buy <item-name> to purchase' })
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    }
    async statsCommand(message) {
        const stats = await this.getGlobalStats();
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x17a2b8)
            .setTitle('📊 FinishThisIdea Statistics')
            .addFields({ name: '👥 Total Users', value: stats.totalUsers.toLocaleString(), inline: true }, { name: '📁 Projects Analyzed', value: stats.projectsAnalyzed.toLocaleString(), inline: true }, { name: '💻 Code Cleaned', value: (stats.codeCleanedMB || 0).toLocaleString() + ' MB', inline: true }, { name: '🏆 Achievements Unlocked', value: (stats.achievementsUnlocked || 0).toLocaleString(), inline: true }, { name: '💰 Tokens in Circulation', value: (stats.tokensCirculation || 0).toLocaleString(), inline: true }, { name: '🤖 AI Queries', value: (stats.aiQueries || 0).toLocaleString(), inline: true })
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    }
    async pricingCommand(message) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xffd700)
            .setTitle('💎 FinishThisIdea Pricing')
            .setDescription('Choose the plan that fits your needs')
            .addFields({
            name: '🆓 Free Tier',
            value: '• 5 code analyses/day\n• Basic AI assistance\n• Community support',
            inline: true
        }, {
            name: '💵 Developer ($5/mo)',
            value: '• Unlimited analyses\n• Advanced AI models\n• Priority support\n• API access',
            inline: true
        }, {
            name: '💰 Team ($25/mo)',
            value: '• Everything in Developer\n• Team collaboration\n• Custom profiles\n• White-label options',
            inline: true
        })
            .setFooter({ text: 'Visit finishthisidea.com/pricing for more details' })
            .setTimestamp();
        await message.reply({ embeds: [embed] });
    }
    async apiInfoCommand(message) {
        const user = await this.getUserByDiscordId(message.author.id);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x007bff)
            .setTitle('🔌 API Information')
            .setDescription('Access FinishThisIdea programmatically')
            .addFields({
            name: '📍 Base URL',
            value: '`https://api.finishthisidea.com/v1`',
            inline: false
        }, {
            name: '🔑 Authentication',
            value: 'Use Bearer token in Authorization header',
            inline: false
        }, {
            name: '📚 Documentation',
            value: '[View Full Docs](https://docs.finishthisidea.com/api)',
            inline: false
        });
        if (user) {
            embed.addFields({
                name: '🎫 Your API Key',
                value: 'Generate at [dashboard.finishthisidea.com](https://dashboard.finishthisidea.com)',
                inline: false
            });
        }
        await message.reply({ embeds: [embed] });
    }
}
exports.DiscordBotService = DiscordBotService;
//# sourceMappingURL=discord-bot.service.js.map