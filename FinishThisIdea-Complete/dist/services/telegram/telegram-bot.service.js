"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramBotService = void 0;
const telegraf_1 = require("telegraf");
const events_1 = require("events");
const client_1 = require("@prisma/client");
const logger_1 = require("../../utils/logger");
const gamification_service_1 = require("../gamification/gamification.service");
const ai_service_1 = require("../ai/ai.service");
const payment_service_1 = require("../payment/payment.service");
const email_queue_service_1 = require("../email/email-queue.service");
class TelegramBotService extends events_1.EventEmitter {
    bot;
    prisma;
    gamificationService;
    aiService;
    paymentService;
    emailQueue;
    config;
    constructor(config) {
        super();
        this.config = config;
        this.prisma = new client_1.PrismaClient();
        this.gamificationService = new gamification_service_1.GamificationService();
        this.aiService = new ai_service_1.AIService();
        this.paymentService = new payment_service_1.PaymentService();
        this.emailQueue = new email_queue_service_1.EmailQueueService();
        this.bot = new telegraf_1.Telegraf(config.botToken);
        this.setupMiddleware();
        this.setupCommands();
        this.setupHandlers();
    }
    async start() {
        try {
            if (this.config.isProduction && this.config.webhookUrl) {
                await this.bot.telegram.setWebhook(this.config.webhookUrl, {
                    secret_token: this.config.secretToken
                });
                logger_1.logger.info('Telegram bot webhook set', { url: this.config.webhookUrl });
            }
            else {
                await this.bot.launch();
                logger_1.logger.info('Telegram bot started in polling mode');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to start Telegram bot', error);
            throw error;
        }
    }
    setupMiddleware() {
        this.bot.use((ctx, next) => {
            if (!ctx.session) {
                ctx.session = {};
            }
            return next();
        });
        this.bot.catch((err, ctx) => {
            logger_1.logger.error('Telegram bot error', err);
            ctx.reply('❌ An error occurred. Please try again later.');
        });
    }
    setupCommands() {
        this.bot.start(async (ctx) => {
            const welcomeMessage = `
🚀 *Welcome to FinishThisIdea!*

AI-powered code cleanup and collaboration platform with gamification features.

*Available Commands:*
/register - Create your account
/balance - Check your balance and stats
/analyze - Analyze code snippet
/cleanup - Clean up code
/projects - Manage projects
/leaderboard - View top users
/ai - Ask AI assistant
/daily - Claim daily bonus
/help - Show all commands

Ready to transform your code? Start with /register!
      `;
            await ctx.replyWithMarkdown(welcomeMessage, telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('📝 Register', 'register')],
                [telegraf_1.Markup.button.callback('📊 Platform Stats', 'stats')],
                [telegraf_1.Markup.button.callback('💎 View Pricing', 'pricing')]
            ]));
        });
        this.bot.command('register', async (ctx) => {
            await this.handleRegistration(ctx);
        });
        this.bot.command('balance', async (ctx) => {
            await this.handleBalance(ctx);
        });
        this.bot.command('analyze', async (ctx) => {
            await this.handleAnalyze(ctx);
        });
        this.bot.command('cleanup', async (ctx) => {
            await this.handleCleanup(ctx);
        });
        this.bot.command('projects', async (ctx) => {
            await this.handleProjects(ctx);
        });
        this.bot.command('leaderboard', async (ctx) => {
            await this.handleLeaderboard(ctx);
        });
        this.bot.command('ai', async (ctx) => {
            await this.handleAI(ctx);
        });
        this.bot.command('daily', async (ctx) => {
            await this.handleDailyBonus(ctx);
        });
        this.bot.command('help', async (ctx) => {
            await this.handleHelp(ctx);
        });
        this.bot.command('stats', async (ctx) => {
            await this.handleStats(ctx);
        });
    }
    setupHandlers() {
        this.bot.on('callback_query', async (ctx) => {
            const callbackData = ctx.callbackQuery?.data;
            if (!callbackData)
                return;
            try {
                switch (callbackData) {
                    case 'register':
                        await this.handleRegistration(ctx);
                        break;
                    case 'stats':
                        await this.handleGlobalStats(ctx);
                        break;
                    case 'pricing':
                        await this.handlePricing(ctx);
                        break;
                    default:
                        if (callbackData.startsWith('project_')) {
                            await this.handleProjectAction(ctx, callbackData);
                        }
                        else if (callbackData.startsWith('analyze_')) {
                            await this.handleAnalyzeAction(ctx, callbackData);
                        }
                }
                await ctx.answerCbQuery();
            }
            catch (error) {
                logger_1.logger.error('Callback query error', error);
                await ctx.answerCbQuery('An error occurred');
            }
        });
        this.bot.on('text', async (ctx) => {
            const state = ctx.session?.state;
            const text = ctx.message?.text;
            if (!state || !text)
                return;
            if (state === 'awaiting_code') {
                await this.handleCodeInput(ctx, text);
            }
            else if (state === 'awaiting_project_name') {
                await this.handleProjectName(ctx, text);
            }
        });
        this.bot.on('document', async (ctx) => {
            await this.handleDocument(ctx);
        });
    }
    async handleRegistration(ctx) {
        const telegramId = ctx.from?.id.toString();
        const username = ctx.from?.username || ctx.from?.first_name || 'User';
        if (!telegramId) {
            await ctx.reply('❌ Unable to get your Telegram ID');
            return;
        }
        try {
            const existingUser = await this.getUserByTelegramId(telegramId);
            if (existingUser) {
                await ctx.reply('✅ You are already registered!');
                return;
            }
            const user = await this.createUser({
                username,
                telegramId,
                email: `${telegramId}@telegram.finishthisidea.com`
            });
            const message = `
🎉 *Registration Successful!*

Welcome to FinishThisIdea, ${username}!

🎁 *Welcome Rewards:*
• 100 tokens credited
• Level 1 status
• "Early Adopter" achievement

Your account is now active. Start analyzing code to earn XP and tokens!
      `;
            await ctx.replyWithMarkdown(message, telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('🎁 Claim Welcome Bonus', 'claim_bonus')],
                [telegraf_1.Markup.button.callback('📚 View Tutorial', 'tutorial')],
                [telegraf_1.Markup.button.callback('💻 Start Analyzing', 'start_analyze')]
            ]));
            await this.gamificationService.trackAction(user.id, 'user.register');
            await this.emailQueue.queueWelcomeSequence(user.id, user.email, username);
        }
        catch (error) {
            logger_1.logger.error('Error in registration', error);
            await ctx.reply('❌ Registration failed. Please try again.');
        }
    }
    async handleBalance(ctx) {
        const user = await this.ensureRegistered(ctx);
        if (!user)
            return;
        const progress = await this.gamificationService.getUserProgress(user.id);
        const stats = await this.getUserStats(user.id);
        const message = `
💰 *Your Balance & Stats*

👤 *Profile*
• Username: ${ctx.from?.username || 'User'}
• Level: ${progress.level}
• XP: ${progress.xp}

💎 *Balance*
• Tokens: ${progress.tokens}
• Lifetime Earned: ${stats.lifetimeTokens || 0}

📊 *Activity*
• Projects: ${stats.projectsCreated}
• Code Analyzed: ${stats.codeAnalyzed}
• Achievements: ${progress.achievements.length}
• Daily Streak: ${stats.streak || 0} days

🏆 *Rank*
• Global Rank: #${await this.gamificationService.getUserRank(user.id)}
    `;
        await ctx.replyWithMarkdown(message, telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('🏆 View Achievements', 'view_achievements')],
            [telegraf_1.Markup.button.callback('📈 Detailed Stats', 'detailed_stats')]
        ]));
    }
    async handleAnalyze(ctx) {
        const user = await this.ensureRegistered(ctx);
        if (!user)
            return;
        ctx.session.state = 'awaiting_code';
        const message = `
🔍 *Code Analysis*

Please send me the code you want to analyze. You can:

1. Paste code directly as text
2. Send a file (.js, .ts, .py, etc.)
3. Share a GitHub Gist URL

Supported languages: JavaScript, TypeScript, Python, Java, Go, Rust, and more!
    `;
        await ctx.replyWithMarkdown(message, telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('❌ Cancel', 'cancel_analyze')]
        ]));
    }
    async handleCleanup(ctx) {
        const user = await this.ensureRegistered(ctx);
        if (!user)
            return;
        const recentAnalyses = await this.getRecentAnalyses(user.id);
        if (recentAnalyses.length === 0) {
            await ctx.reply('❌ No recent code analyses found. Use /analyze first!');
            return;
        }
        const buttons = recentAnalyses.map(analysis => [
            telegraf_1.Markup.button.callback(`🧹 ${analysis.filename || 'Code'} (${analysis.qualityScore}/100)`, `cleanup_${analysis.id}`)
        ]);
        await ctx.replyWithMarkdown('*Select code to clean up:*', telegraf_1.Markup.inlineKeyboard(buttons));
    }
    async handleLeaderboard(ctx) {
        const leaderboard = await this.gamificationService.getLeaderboard('xp', 10);
        const medals = ['🥇', '🥈', '🥉'];
        const entries = leaderboard.map((entry, index) => {
            const medal = medals[index] || `${index + 1}.`;
            return `${medal} *${entry.username}* - Level ${entry.level} (${entry.score} XP)`;
        }).join('\n');
        const message = `
🏆 *Global Leaderboard*

${entries}

Your rank: #${await this.gamificationService.getUserRank(ctx.from?.id.toString() || '')}
    `;
        await ctx.replyWithMarkdown(message, telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('💰 Token Leaders', 'leaderboard_tokens')],
            [telegraf_1.Markup.button.callback('🏆 Achievement Leaders', 'leaderboard_achievements')]
        ]));
    }
    async handleAI(ctx) {
        const user = await this.ensureRegistered(ctx);
        if (!user)
            return;
        const text = ctx.message?.text?.replace('/ai', '').trim();
        if (!text) {
            await ctx.reply('❓ Please provide a question. Example: /ai How do I optimize React components?');
            return;
        }
        const typing = ctx.replyWithChatAction('typing');
        try {
            const response = await this.aiService.query({
                prompt: text,
                userId: user.id,
                context: 'telegram'
            });
            const maxLength = 4000;
            if (response.length > maxLength) {
                const chunks = this.splitMessage(response, maxLength);
                for (const chunk of chunks) {
                    await ctx.replyWithMarkdown(chunk);
                }
            }
            else {
                await ctx.replyWithMarkdown(response);
            }
            await this.gamificationService.trackAction(user.id, 'ai.query');
        }
        catch (error) {
            logger_1.logger.error('Error in AI query', error);
            await ctx.reply('❌ Failed to get AI response. Please try again.');
        }
    }
    async handleDailyBonus(ctx) {
        const user = await this.ensureRegistered(ctx);
        if (!user)
            return;
        const result = await this.claimDailyBonus(user.id);
        if (!result.success) {
            const timeLeft = result.nextClaimTime - Date.now();
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            await ctx.reply(`⏰ Daily bonus already claimed! Come back in ${hours}h ${minutes}m`);
            return;
        }
        const message = `
🎁 *Daily Bonus Claimed!*

💰 Base Bonus: ${result.baseBonus} tokens
🔥 Streak Bonus: ${result.streakBonus} tokens
💎 Total: ${result.totalBonus} tokens

Current Streak: ${result.streak} days
${result.streak >= 7 ? '⭐ *7-Day Streak Bonus Active!*' : ''}
    `;
        await ctx.replyWithMarkdown(message);
    }
    async handleHelp(ctx) {
        const helpMessage = `
📚 *FinishThisIdea Bot Commands*

*Basic Commands:*
/start - Welcome message
/register - Create account
/help - Show this help

*Account & Stats:*
/balance - Check balance and stats
/daily - Claim daily bonus
/leaderboard - View top users

*Code Tools:*
/analyze - Analyze code quality
/cleanup - Clean up analyzed code
/projects - Manage projects

*AI & Support:*
/ai <question> - Ask AI assistant
/feedback - Send feedback

*Tips:*
• Send code files directly for instant analysis
• Complete daily tasks for bonus tokens
• Higher levels unlock better features
• Join our Discord for community support

Need help? Contact @finishthisidea_support
    `;
        await ctx.replyWithMarkdown(helpMessage);
    }
    async handleStats(ctx) {
        if (!this.isAdmin(ctx.from?.id)) {
            await ctx.reply('❌ Admin access required');
            return;
        }
        const stats = await this.getPlatformStats();
        const message = `
📊 *Platform Statistics*

👥 *Users*
• Total Users: ${stats.totalUsers}
• Active Today: ${stats.activeToday}
• New This Week: ${stats.newThisWeek}

💻 *Activity*
• Code Analyzed: ${stats.codeAnalyzed}
• Projects Created: ${stats.projectsCreated}
• AI Queries: ${stats.aiQueries}

💰 *Economy*
• Tokens in Circulation: ${stats.tokensCirculation}
• Daily Bonuses Claimed: ${stats.dailyBonusesClaimed}
• Average User Level: ${stats.avgUserLevel.toFixed(1)}

🎯 *Engagement*
• Daily Active Users: ${stats.dau}
• Weekly Active Users: ${stats.wau}
• Retention Rate: ${stats.retentionRate}%
    `;
        await ctx.replyWithMarkdown(message);
    }
    async handleCodeInput(ctx, code) {
        ctx.session.state = undefined;
        const user = await this.ensureRegistered(ctx);
        if (!user)
            return;
        await ctx.reply('🔍 Analyzing your code...');
        try {
            const language = this.detectLanguage(code);
            const analysis = await this.aiService.analyzeCode({
                code,
                language,
                userId: user.id
            });
            const message = `
📊 *Code Analysis Complete*

📈 *Quality Score: ${analysis.qualityScore}/100*

🔍 *Analysis:*
${analysis.summary}

⚠️ *Issues Found: ${analysis.issues}*
💡 *Suggestions: ${analysis.suggestions.length}*

${analysis.qualityScore < 70 ? '🧹 *Recommendation: Consider code cleanup*' : '✨ *Good code quality!*'}
      `;
            await ctx.replyWithMarkdown(message, telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('🧹 Clean Up Code', `cleanup_${analysis.id}`)],
                [telegraf_1.Markup.button.callback('📋 View Details', `details_${analysis.id}`)],
                [telegraf_1.Markup.button.callback('💾 Save to Project', `save_${analysis.id}`)]
            ]));
            await this.gamificationService.trackAction(user.id, 'code.analyze');
        }
        catch (error) {
            logger_1.logger.error('Error analyzing code', error);
            await ctx.reply('❌ Failed to analyze code. Please try again.');
        }
    }
    async handleDocument(ctx) {
        const user = await this.ensureRegistered(ctx);
        if (!user)
            return;
        const document = ctx.message?.document;
        if (!document)
            return;
        const supportedExtensions = ['.js', '.ts', '.py', '.java', '.go', '.rs', '.rb', '.php'];
        const fileExtension = document.file_name?.substring(document.file_name.lastIndexOf('.')) || '';
        if (!supportedExtensions.includes(fileExtension)) {
            await ctx.reply('❌ Unsupported file type. Please send a code file.');
            return;
        }
        try {
            await ctx.reply('📥 Downloading file...');
            const fileLink = await ctx.telegram.getFileLink(document.file_id);
            const response = await fetch(fileLink.toString());
            const code = await response.text();
            await this.handleCodeInput(ctx, code);
        }
        catch (error) {
            logger_1.logger.error('Error handling document', error);
            await ctx.reply('❌ Failed to process file. Please try again.');
        }
    }
    async handleGlobalStats(ctx) {
        const stats = await this.getPlatformStats();
        const message = `
📊 *FinishThisIdea Platform Stats*

👥 Total Users: ${stats.totalUsers}
💻 Code Analyzed: ${stats.codeAnalyzed}
🚀 Projects Created: ${stats.projectsCreated}
🤖 AI Queries: ${stats.aiQueries}
💰 Tokens Earned: ${stats.tokensCirculation}

Join the community and start transforming your code today!
    `;
        await ctx.replyWithMarkdown(message);
    }
    async handlePricing(ctx) {
        const message = `
💎 *FinishThisIdea Pricing*

🆓 *Free Tier*
• 5 code analyses/day
• Basic AI assistance
• Community support

💵 *Developer ($5/mo)*
• Unlimited analyses
• Advanced AI models
• Priority support
• API access (1000 calls/day)

💰 *Team ($25/mo)*
• Everything in Developer
• Team collaboration
• Custom code profiles
• White-label options
• API access (10000 calls/day)

🏢 *Enterprise*
• Custom pricing
• Dedicated support
• On-premise deployment
• Custom integrations

Start free, upgrade anytime!
    `;
        await ctx.replyWithMarkdown(message, telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.url('🚀 Upgrade Now', 'https://finishthisidea.com/pricing')],
            [telegraf_1.Markup.button.callback('🆓 Continue Free', 'continue_free')]
        ]));
    }
    async ensureRegistered(ctx) {
        const telegramId = ctx.from?.id.toString();
        if (!telegramId) {
            await ctx.reply('❌ Unable to identify user');
            return null;
        }
        const user = await this.getUserByTelegramId(telegramId);
        if (!user) {
            await ctx.replyWithMarkdown('❌ You need to register first!', telegraf_1.Markup.inlineKeyboard([[telegraf_1.Markup.button.callback('📝 Register Now', 'register')]]));
            return null;
        }
        return user;
    }
    detectLanguage(code) {
        if (code.includes('function') || code.includes('const') || code.includes('let')) {
            return 'javascript';
        }
        else if (code.includes('def ') || code.includes('import ')) {
            return 'python';
        }
        else if (code.includes('public class') || code.includes('private ')) {
            return 'java';
        }
        else if (code.includes('func ') || code.includes('package ')) {
            return 'go';
        }
        return 'unknown';
    }
    splitMessage(text, maxLength) {
        const chunks = [];
        let currentChunk = '';
        const lines = text.split('\n');
        for (const line of lines) {
            if (currentChunk.length + line.length > maxLength) {
                chunks.push(currentChunk);
                currentChunk = line;
            }
            else {
                currentChunk += '\n' + line;
            }
        }
        if (currentChunk) {
            chunks.push(currentChunk);
        }
        return chunks;
    }
    isAdmin(userId) {
        const adminIds = process.env.TELEGRAM_ADMIN_IDS?.split(',').map(id => parseInt(id)) || [];
        return userId ? adminIds.includes(userId) : false;
    }
    async getUserByTelegramId(telegramId) {
        return null;
    }
    async createUser(data) {
        return { id: 'user-' + Date.now(), ...data, created: new Date() };
    }
    async getUserStats(userId) {
        return {
            projectsCreated: 0,
            codeAnalyzed: 0,
            lifetimeTokens: 100,
            streak: 0
        };
    }
    async getPlatformStats() {
        return {
            totalUsers: 1234,
            activeToday: 234,
            newThisWeek: 89,
            codeAnalyzed: 5678,
            projectsCreated: 890,
            aiQueries: 12345,
            tokensCirculation: 567890,
            dailyBonusesClaimed: 456,
            avgUserLevel: 2.3,
            dau: 234,
            wau: 567,
            retentionRate: 78
        };
    }
    async getRecentAnalyses(userId) {
        return [];
    }
    async claimDailyBonus(userId) {
        return {
            success: true,
            baseBonus: 50,
            streakBonus: 10,
            totalBonus: 60,
            streak: 3
        };
    }
    handleWebhook() {
        return this.bot.webhookCallback('/telegram-webhook');
    }
    stop() {
        this.bot.stop();
        logger_1.logger.info('Telegram bot stopped');
    }
}
exports.TelegramBotService = TelegramBotService;
//# sourceMappingURL=telegram-bot.service.js.map