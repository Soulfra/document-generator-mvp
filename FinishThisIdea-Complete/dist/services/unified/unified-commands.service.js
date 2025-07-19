"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedCommandsService = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
const gamification_service_1 = require("../gamification/gamification.service");
const ai_service_1 = require("../ai/ai.service");
const project_service_1 = require("../project/project.service");
const payment_service_1 = require("../payment/payment.service");
const ai_arena_service_1 = require("../ai-arena/ai-arena.service");
const billion_dollar_game_service_1 = require("../game/billion-dollar-game.service");
class UnifiedCommandsService extends events_1.EventEmitter {
    commands = new Map();
    aliases = new Map();
    cooldowns = new Map();
    gamificationService;
    aiService;
    projectService;
    paymentService;
    arenaService;
    billionDollarGame;
    constructor() {
        super();
        this.gamificationService = new gamification_service_1.GamificationService();
        this.aiService = new ai_service_1.AIService();
        this.projectService = new project_service_1.ProjectService();
        this.paymentService = new payment_service_1.PaymentService();
        this.arenaService = new ai_arena_service_1.AIArenaService();
        this.billionDollarGame = new billion_dollar_game_service_1.BillionDollarGameService();
        this.registerCommands();
    }
    registerCommands() {
        const commands = [
            {
                name: 'help',
                aliases: ['h', 'commands'],
                description: 'Show help information',
                category: 'general',
                usage: 'help [command]',
                execute: async (ctx) => await this.helpCommand(ctx)
            },
            {
                name: 'ping',
                description: 'Check bot latency',
                category: 'general',
                execute: async (ctx) => await this.pingCommand(ctx)
            },
            {
                name: 'stats',
                aliases: ['statistics'],
                description: 'Show platform statistics',
                category: 'general',
                execute: async (ctx) => await this.statsCommand(ctx)
            },
            {
                name: 'register',
                aliases: ['signup', 'join'],
                description: 'Create your account',
                category: 'account',
                execute: async (ctx) => await this.registerCommand(ctx)
            },
            {
                name: 'profile',
                aliases: ['account', 'me'],
                description: 'View your profile',
                category: 'account',
                usage: 'profile [@user]',
                execute: async (ctx) => await this.profileCommand(ctx)
            },
            {
                name: 'balance',
                aliases: ['bal', 'tokens'],
                description: 'Check your token balance',
                category: 'account',
                execute: async (ctx) => await this.balanceCommand(ctx)
            },
            {
                name: 'daily',
                aliases: ['claim'],
                description: 'Claim daily bonus',
                category: 'account',
                cooldown: 86400,
                execute: async (ctx) => await this.dailyCommand(ctx)
            },
            {
                name: 'leaderboard',
                aliases: ['lb', 'top'],
                description: 'View global leaderboard',
                category: 'account',
                usage: 'leaderboard [xp|tokens|achievements]',
                execute: async (ctx) => await this.leaderboardCommand(ctx)
            },
            {
                name: 'analyze',
                aliases: ['analyse', 'check'],
                description: 'Analyze code quality',
                category: 'analysis',
                usage: 'analyze <code or file>',
                cooldown: 30,
                execute: async (ctx) => await this.analyzeCommand(ctx)
            },
            {
                name: 'cleanup',
                aliases: ['clean', 'refactor'],
                description: 'Clean up code',
                category: 'analysis',
                usage: 'cleanup <analysis_id>',
                cooldown: 60,
                execute: async (ctx) => await this.cleanupCommand(ctx)
            },
            {
                name: 'ai',
                aliases: ['ask', 'gpt'],
                description: 'Ask AI assistant',
                category: 'analysis',
                usage: 'ai <question>',
                cooldown: 10,
                execute: async (ctx) => await this.aiCommand(ctx)
            },
            {
                name: 'projects',
                aliases: ['project', 'list'],
                description: 'List your projects',
                category: 'project',
                execute: async (ctx) => await this.projectsCommand(ctx)
            },
            {
                name: 'create',
                aliases: ['new'],
                description: 'Create new project',
                category: 'project',
                usage: 'create <name>',
                execute: async (ctx) => await this.createProjectCommand(ctx)
            },
            {
                name: 'share',
                description: 'Share project',
                category: 'project',
                usage: 'share <project_id> <@user>',
                execute: async (ctx) => await this.shareProjectCommand(ctx)
            },
            {
                name: 'arena',
                aliases: ['fight', 'battle'],
                description: 'AI Arena commands',
                category: 'game',
                usage: 'arena [create|battle|bet|rankings]',
                execute: async (ctx) => await this.arenaCommand(ctx)
            },
            {
                name: 'billion',
                aliases: ['bdg', 'billiondollar'],
                description: 'Billion Dollar Game',
                category: 'game',
                usage: 'billion [join|status|agent]',
                execute: async (ctx) => await this.billionCommand(ctx)
            },
            {
                name: 'inventory',
                aliases: ['inv', 'items'],
                description: 'View your inventory',
                category: 'game',
                execute: async (ctx) => await this.inventoryCommand(ctx)
            },
            {
                name: 'shop',
                aliases: ['store', 'buy'],
                description: 'View token shop',
                category: 'economy',
                execute: async (ctx) => await this.shopCommand(ctx)
            },
            {
                name: 'transfer',
                aliases: ['send', 'pay'],
                description: 'Transfer tokens',
                category: 'economy',
                usage: 'transfer <@user> <amount>',
                cooldown: 60,
                execute: async (ctx) => await this.transferCommand(ctx)
            },
            {
                name: 'upgrade',
                aliases: ['premium', 'pro'],
                description: 'Upgrade your account',
                category: 'economy',
                execute: async (ctx) => await this.upgradeCommand(ctx)
            },
            {
                name: 'admin',
                description: 'Admin control panel',
                category: 'admin',
                adminOnly: true,
                execute: async (ctx) => await this.adminCommand(ctx)
            },
            {
                name: 'grant',
                description: 'Grant tokens to user',
                category: 'admin',
                usage: 'grant <@user> <amount>',
                adminOnly: true,
                execute: async (ctx) => await this.grantCommand(ctx)
            },
            {
                name: 'announce',
                description: 'Make announcement',
                category: 'admin',
                usage: 'announce <message>',
                adminOnly: true,
                execute: async (ctx) => await this.announceCommand(ctx)
            }
        ];
        commands.forEach(cmd => this.registerCommand(cmd));
        logger_1.logger.info(`Registered ${this.commands.size} unified commands`);
    }
    registerCommand(command) {
        this.commands.set(command.name, command);
        if (command.aliases) {
            command.aliases.forEach(alias => {
                this.aliases.set(alias, command.name);
            });
        }
    }
    async executeCommand(commandName, context) {
        try {
            const resolvedName = this.aliases.get(commandName) || commandName;
            const command = this.commands.get(resolvedName);
            if (!command) {
                await context.reply(`❌ Unknown command: ${commandName}`);
                return;
            }
            if (command.platforms && !command.platforms.includes(context.platform)) {
                await context.reply('❌ This command is not available on this platform');
                return;
            }
            if (command.adminOnly && !context.isAdmin) {
                await context.reply('❌ This command requires admin privileges');
                return;
            }
            if (command.guildOnly && !context.guildId) {
                await context.reply('❌ This command can only be used in servers');
                return;
            }
            if (command.dmOnly && context.guildId) {
                await context.reply('❌ This command can only be used in DMs');
                return;
            }
            if (command.cooldown) {
                const remaining = this.checkCooldown(context.userId, command.name, command.cooldown);
                if (remaining > 0) {
                    await context.reply(`⏱️ Please wait ${remaining} seconds before using this command again`);
                    return;
                }
            }
            await command.execute(context);
            await this.gamificationService.trackAction(context.userId, `command.${command.name}`);
            if (command.cooldown) {
                this.setCooldown(context.userId, command.name, command.cooldown);
            }
            logger_1.logger.info('Command executed', {
                command: command.name,
                user: context.username,
                platform: context.platform
            });
        }
        catch (error) {
            logger_1.logger.error('Command execution error', {
                command: commandName,
                error,
                user: context.username
            });
            await context.reply('❌ An error occurred while executing this command');
        }
    }
    async helpCommand(ctx) {
        if (ctx.args.length > 0) {
            const cmdName = ctx.args[0].toLowerCase();
            const resolvedName = this.aliases.get(cmdName) || cmdName;
            const command = this.commands.get(resolvedName);
            if (!command) {
                await ctx.reply(`❌ Command not found: ${cmdName}`);
                return;
            }
            const embed = {
                title: `📚 ${command.name} Command`,
                color: 0x667eea,
                fields: [
                    { name: 'Description', value: command.description },
                    { name: 'Category', value: command.category, inline: true }
                ]
            };
            if (command.aliases && command.aliases.length > 0) {
                embed.fields.push({
                    name: 'Aliases',
                    value: command.aliases.join(', '),
                    inline: true
                });
            }
            if (command.usage) {
                embed.fields.push({
                    name: 'Usage',
                    value: `\`${command.usage}\``
                });
            }
            if (command.examples) {
                embed.fields.push({
                    name: 'Examples',
                    value: command.examples.map(ex => `\`${ex}\``).join('\n')
                });
            }
            if (command.cooldown) {
                embed.fields.push({
                    name: 'Cooldown',
                    value: `${command.cooldown} seconds`,
                    inline: true
                });
            }
            await ctx.reply({ embeds: [embed] });
        }
        else {
            const categories = this.getCommandsByCategory();
            const embed = {
                title: '📚 Command List',
                description: 'Use `help <command>` for detailed information',
                color: 0x667eea,
                fields: []
            };
            for (const [category, commands] of Object.entries(categories)) {
                embed.fields.push({
                    name: this.formatCategory(category),
                    value: commands.map(cmd => `\`${cmd.name}\``).join(', ')
                });
            }
            await ctx.reply({ embeds: [embed] });
        }
    }
    async pingCommand(ctx) {
        const start = Date.now();
        await ctx.reply('🏓 Pinging...');
        const latency = Date.now() - start;
        await ctx.reply({
            embeds: [{
                    title: '🏓 Pong!',
                    color: 0x4ade80,
                    fields: [
                        { name: 'Latency', value: `${latency}ms`, inline: true },
                        { name: 'Platform', value: ctx.platform, inline: true }
                    ]
                }]
        });
    }
    async statsCommand(ctx) {
        const stats = {
            totalUsers: 15234,
            activeToday: 3456,
            codeAnalyzed: 89012,
            projectsCreated: 5678,
            tokensCirculation: 12345678
        };
        const embed = {
            title: '📊 Platform Statistics',
            color: 0x667eea,
            fields: [
                { name: '👥 Total Users', value: stats.totalUsers.toLocaleString(), inline: true },
                { name: '🟢 Active Today', value: stats.activeToday.toLocaleString(), inline: true },
                { name: '💻 Code Analyzed', value: stats.codeAnalyzed.toLocaleString(), inline: true },
                { name: '📁 Projects', value: stats.projectsCreated.toLocaleString(), inline: true },
                { name: '💰 Tokens', value: stats.tokensCirculation.toLocaleString(), inline: true }
            ],
            timestamp: true
        };
        await ctx.reply({ embeds: [embed] });
    }
    async registerCommand(ctx) {
        try {
            const existingUser = await this.getUserByPlatformId(ctx.platform, ctx.userId);
            if (existingUser) {
                await ctx.reply('✅ You are already registered!');
                return;
            }
            const user = await this.createUser({
                username: ctx.username,
                platformId: ctx.userId,
                platform: ctx.platform
            });
            await this.gamificationService.trackAction(user.id, 'user.register');
            const embed = {
                title: '🎉 Registration Successful!',
                description: `Welcome to FinishThisIdea, ${ctx.username}!`,
                color: 0x4ade80,
                fields: [
                    { name: '🎁 Welcome Bonus', value: '100 tokens', inline: true },
                    { name: '📊 Starting Level', value: 'Level 1', inline: true },
                    { name: '🏆 Achievement', value: 'Early Adopter', inline: true }
                ],
                footer: 'Start analyzing code to earn XP and tokens!'
            };
            const buttons = [
                [
                    { label: 'View Profile', customId: 'view_profile', style: 'primary' },
                    { label: 'Get Started', customId: 'get_started', style: 'success' }
                ]
            ];
            await ctx.reply({ embeds: [embed], buttons });
        }
        catch (error) {
            logger_1.logger.error('Registration error', error);
            await ctx.reply('❌ Registration failed. Please try again.');
        }
    }
    async profileCommand(ctx) {
        const user = await this.ensureUser(ctx);
        if (!user)
            return;
        const progress = await this.gamificationService.getUserProgress(user.id);
        const rank = await this.gamificationService.getUserRank(user.id);
        const embed = {
            title: `👤 ${ctx.username}'s Profile`,
            color: 0x667eea,
            thumbnail: ctx.platform === 'discord' ? `https://cdn.discordapp.com/avatars/${ctx.userId}/default.png` : undefined,
            fields: [
                { name: '📊 Level', value: progress.level.toString(), inline: true },
                { name: '⭐ XP', value: progress.xp.toLocaleString(), inline: true },
                { name: '🏆 Rank', value: `#${rank}`, inline: true },
                { name: '💰 Tokens', value: progress.tokens.toLocaleString(), inline: true },
                { name: '🎯 Achievements', value: progress.achievements.length.toString(), inline: true },
                { name: '🔥 Streak', value: `${progress.streak} days`, inline: true }
            ]
        };
        const xpForNext = this.gamificationService.getXPForLevel(progress.level + 1);
        const xpProgress = progress.xp % xpForNext;
        const progressBar = this.createProgressBar(xpProgress, xpForNext);
        embed.fields.push({
            name: 'Progress to Next Level',
            value: `${progressBar} ${xpProgress}/${xpForNext} XP`
        });
        await ctx.reply({ embeds: [embed] });
    }
    async balanceCommand(ctx) {
        const user = await this.ensureUser(ctx);
        if (!user)
            return;
        const progress = await this.gamificationService.getUserProgress(user.id);
        await ctx.reply({
            content: `💰 **Your Balance**\n\nTokens: **${progress.tokens.toLocaleString()}** 🪙`
        });
    }
    async dailyCommand(ctx) {
        const user = await this.ensureUser(ctx);
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
        const embed = {
            title: '🎁 Daily Bonus Claimed!',
            color: 0x4ade80,
            fields: [
                { name: '💰 Base Bonus', value: `${result.baseBonus} tokens`, inline: true },
                { name: '🔥 Streak Bonus', value: `${result.streakBonus} tokens`, inline: true },
                { name: '💎 Total', value: `${result.totalBonus} tokens`, inline: true },
                { name: '📅 Current Streak', value: `${result.streak} days`, inline: true }
            ]
        };
        if (result.streak >= 7) {
            embed.fields.push({
                name: '⭐ Bonus',
                value: '7-Day Streak Bonus Active!'
            });
        }
        await ctx.reply({ embeds: [embed] });
    }
    async leaderboardCommand(ctx) {
        const type = ctx.args[0]?.toLowerCase() || 'xp';
        const validTypes = ['xp', 'tokens', 'achievements'];
        if (!validTypes.includes(type)) {
            await ctx.reply('❌ Invalid leaderboard type. Use: xp, tokens, or achievements');
            return;
        }
        const leaderboard = await this.gamificationService.getLeaderboard(type, 10);
        const medals = ['🥇', '🥈', '🥉'];
        const entries = leaderboard.map((entry, index) => {
            const medal = medals[index] || `${index + 1}.`;
            return `${medal} **${entry.username}** - Level ${entry.level} (${entry.score.toLocaleString()} ${type})`;
        }).join('\n');
        const embed = {
            title: `🏆 ${this.formatCategory(type)} Leaderboard`,
            description: entries,
            color: 0xffd700,
            footer: `Your rank: #${await this.gamificationService.getUserRank(ctx.userId)}`
        };
        await ctx.reply({ embeds: [embed] });
    }
    async analyzeCommand(ctx) {
        const user = await this.ensureUser(ctx);
        if (!user)
            return;
        if (ctx.args.length === 0) {
            await ctx.reply('❌ Please provide code to analyze or attach a file');
            return;
        }
        await ctx.reply('🔍 Analyzing code...');
        try {
            const code = ctx.args.join(' ');
            const language = this.detectLanguage(code);
            const analysis = await this.aiService.analyzeCode({
                code,
                language,
                userId: user.id
            });
            const embed = {
                title: '📊 Code Analysis Complete',
                color: analysis.qualityScore >= 70 ? 0x4ade80 : 0xf59e0b,
                fields: [
                    { name: '📈 Quality Score', value: `${analysis.qualityScore}/100`, inline: true },
                    { name: '⚠️ Issues Found', value: analysis.issues.toString(), inline: true },
                    { name: '💡 Suggestions', value: analysis.suggestions.length.toString(), inline: true },
                    { name: '🔍 Summary', value: analysis.summary }
                ]
            };
            if (analysis.qualityScore < 70) {
                embed.fields.push({
                    name: '🧹 Recommendation',
                    value: 'Consider using the cleanup command to improve code quality'
                });
            }
            const buttons = [
                [
                    { label: '🧹 Clean Up', customId: `cleanup_${analysis.id}`, style: 'primary' },
                    { label: '📋 View Details', customId: `details_${analysis.id}`, style: 'secondary' }
                ]
            ];
            await ctx.reply({ embeds: [embed], buttons });
            await this.gamificationService.trackAction(user.id, 'code.analyze');
        }
        catch (error) {
            logger_1.logger.error('Analyze command error', error);
            await ctx.reply('❌ Failed to analyze code. Please try again.');
        }
    }
    async cleanupCommand(ctx) {
        const user = await this.ensureUser(ctx);
        if (!user)
            return;
        if (ctx.args.length === 0) {
            await ctx.reply('❌ Please provide an analysis ID');
            return;
        }
        const analysisId = ctx.args[0];
        await ctx.reply('🧹 Cleaning up code...');
        try {
            const analysis = await this.getAnalysis(analysisId);
            if (!analysis) {
                await ctx.reply('❌ Analysis not found');
                return;
            }
            const cleanedCode = await this.aiService.cleanupCode({
                code: analysis.code,
                language: analysis.language,
                issues: analysis.issues,
                userId: user.id
            });
            const embed = {
                title: '✨ Code Cleanup Complete',
                color: 0x4ade80,
                fields: [
                    { name: '📈 Quality Improvement', value: `+${cleanedCode.improvement}%`, inline: true },
                    { name: '🔧 Changes Made', value: cleanedCode.changesCount.toString(), inline: true },
                    { name: '✅ Issues Fixed', value: cleanedCode.fixedIssues.toString(), inline: true }
                ],
                footer: 'Use the export command to save the cleaned code'
            };
            await ctx.reply({ embeds: [embed] });
            await this.gamificationService.trackAction(user.id, 'code.cleanup');
            await this.gamificationService.trackAction(user.id, 'tokens.earn', 10);
        }
        catch (error) {
            logger_1.logger.error('Cleanup command error', error);
            await ctx.reply('❌ Failed to clean up code. Please try again.');
        }
    }
    async aiCommand(ctx) {
        const user = await this.ensureUser(ctx);
        if (!user)
            return;
        if (ctx.args.length === 0) {
            await ctx.reply('❓ Please provide a question');
            return;
        }
        const question = ctx.args.join(' ');
        await ctx.react('🤔');
        try {
            const response = await this.aiService.query({
                prompt: question,
                userId: user.id,
                context: ctx.platform
            });
            const chunks = this.splitMessage(response, 2000);
            for (const chunk of chunks) {
                await ctx.reply(chunk);
            }
            await this.gamificationService.trackAction(user.id, 'ai.query');
        }
        catch (error) {
            logger_1.logger.error('AI command error', error);
            await ctx.reply('❌ Failed to get AI response. Please try again.');
        }
    }
    async arenaCommand(ctx) {
        const user = await this.ensureUser(ctx);
        if (!user)
            return;
        const subcommand = ctx.args[0]?.toLowerCase() || 'help';
        switch (subcommand) {
            case 'create':
                await this.arenaCreateFighter(ctx, user);
                break;
            case 'battle':
                await this.arenaStartBattle(ctx, user);
                break;
            case 'bet':
                await this.arenaPlaceBet(ctx, user);
                break;
            case 'rankings':
                await this.arenaRankings(ctx);
                break;
            default:
                await this.arenaHelp(ctx);
        }
    }
    async billionCommand(ctx) {
        const user = await this.ensureUser(ctx);
        if (!user)
            return;
        const subcommand = ctx.args[0]?.toLowerCase() || 'status';
        switch (subcommand) {
            case 'join':
                await this.billionJoinGame(ctx, user);
                break;
            case 'status':
                await this.billionGameStatus(ctx, user);
                break;
            case 'agent':
                await this.billionAgentInfo(ctx, user);
                break;
            default:
                await this.billionHelp(ctx);
        }
    }
    checkCooldown(userId, commandName, cooldownTime) {
        if (!this.cooldowns.has(commandName)) {
            this.cooldowns.set(commandName, new Map());
        }
        const timestamps = this.cooldowns.get(commandName);
        const now = Date.now();
        const cooldownAmount = cooldownTime * 1000;
        if (timestamps.has(userId)) {
            const expirationTime = timestamps.get(userId) + cooldownAmount;
            if (now < expirationTime) {
                return Math.ceil((expirationTime - now) / 1000);
            }
        }
        return 0;
    }
    setCooldown(userId, commandName, cooldownTime) {
        if (!this.cooldowns.has(commandName)) {
            this.cooldowns.set(commandName, new Map());
        }
        const timestamps = this.cooldowns.get(commandName);
        timestamps.set(userId, Date.now());
        setTimeout(() => {
            timestamps.delete(userId);
        }, cooldownTime * 1000);
    }
    getCommandsByCategory() {
        const categories = {
            general: [],
            account: [],
            analysis: [],
            project: [],
            game: [],
            economy: [],
            admin: []
        };
        for (const command of this.commands.values()) {
            categories[command.category].push(command);
        }
        return categories;
    }
    formatCategory(category) {
        const formatted = {
            general: '📌 General',
            account: '👤 Account',
            analysis: '🔍 Analysis',
            project: '📁 Projects',
            game: '🎮 Games',
            economy: '💰 Economy',
            admin: '🛡️ Admin',
            xp: 'XP',
            tokens: 'Tokens',
            achievements: 'Achievements'
        };
        return formatted[category] || category;
    }
    createProgressBar(current, max, length = 10) {
        const percentage = current / max;
        const filled = Math.floor(percentage * length);
        const empty = length - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
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
    async ensureUser(ctx) {
        const user = await this.getUserByPlatformId(ctx.platform, ctx.userId);
        if (!user) {
            await ctx.reply('❌ You need to register first! Use the `register` command.');
            return null;
        }
        return user;
    }
    async getUserByPlatformId(platform, platformId) {
        return null;
    }
    async createUser(data) {
        return { id: 'user-' + Date.now(), ...data };
    }
    async getAnalysis(analysisId) {
        return null;
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
    async arenaCreateFighter(ctx, user) {
        const name = ctx.args.slice(1).join(' ') || 'Fighter';
        try {
            const fighter = await this.arenaService.createFighter({
                name,
                ownerId: user.id
            });
            const embed = {
                title: '🤖 AI Fighter Created!',
                color: 0x4ade80,
                fields: [
                    { name: 'Name', value: fighter.name, inline: true },
                    { name: 'Type', value: fighter.fightingStyle, inline: true },
                    { name: 'Power Level', value: fighter.powerLevel.toString(), inline: true },
                    { name: 'Attack', value: fighter.stats.attack.toString(), inline: true },
                    { name: 'Defense', value: fighter.stats.defense.toString(), inline: true },
                    { name: 'Speed', value: fighter.stats.speed.toString(), inline: true }
                ]
            };
            await ctx.reply({ embeds: [embed] });
        }
        catch (error) {
            await ctx.reply('❌ Failed to create fighter');
        }
    }
    async arenaStartBattle(ctx, user) {
        await ctx.reply('🏟️ Arena battles coming soon!');
    }
    async arenaPlaceBet(ctx, user) {
        await ctx.reply('💰 Betting system coming soon!');
    }
    async arenaRankings(ctx) {
        const rankings = await this.arenaService.getFighterRankings(10);
        const entries = rankings.map((fighter, index) => {
            const winRate = fighter.wins / (fighter.wins + fighter.losses || 1);
            return `${index + 1}. **${fighter.name}** - ${fighter.wins}W/${fighter.losses}L (${(winRate * 100).toFixed(0)}%)`;
        }).join('\n');
        const embed = {
            title: '🏆 AI Arena Rankings',
            description: entries || 'No fighters yet',
            color: 0xffd700
        };
        await ctx.reply({ embeds: [embed] });
    }
    async arenaHelp(ctx) {
        const embed = {
            title: '🏟️ AI Arena Commands',
            description: 'Create AI fighters and battle for glory!',
            color: 0x667eea,
            fields: [
                { name: 'arena create <name>', value: 'Create a new AI fighter' },
                { name: 'arena battle', value: 'Start a battle' },
                { name: 'arena bet', value: 'Place bets on battles' },
                { name: 'arena rankings', value: 'View top fighters' }
            ]
        };
        await ctx.reply({ embeds: [embed] });
    }
    async billionJoinGame(ctx, user) {
        try {
            const result = await this.billionDollarGame.joinGame(user.id, ctx.username);
            const embed = {
                title: '🎮 Welcome to the Billion Dollar Game!',
                description: `You've joined the collective quest to reach $1 billion!`,
                color: 0x4ade80,
                fields: [
                    { name: '🤖 Your Agent', value: result.agent.name, inline: true },
                    { name: '⚡ Type', value: result.agent.type, inline: true },
                    { name: '💰 Entry Fee', value: `${result.entryFee} tokens`, inline: true },
                    { name: '📊 Starting Output', value: `$${result.agent.dailyOutput}/day`, inline: true }
                ],
                footer: 'Your AI agent will now work autonomously to generate value!'
            };
            await ctx.reply({ embeds: [embed] });
        }
        catch (error) {
            await ctx.reply(`❌ ${error.message}`);
        }
    }
    async billionGameStatus(ctx, user) {
        const gameStats = this.billionDollarGame.getGameStats();
        const playerData = await this.billionDollarGame.getPlayerData(user.id);
        const embed = {
            title: '💰 Billion Dollar Game Status',
            color: 0x667eea,
            fields: [
                { name: '🎯 Progress', value: `$${gameStats.totalCollected.toLocaleString()} / $1B (${gameStats.progressPercentage.toFixed(2)}%)` },
                { name: '👥 Players', value: gameStats.playerCount.toString(), inline: true },
                { name: '🟢 Active', value: gameStats.activePlayerCount.toString(), inline: true },
                { name: '🌀 Phase', value: gameStats.currentPhase.toString(), inline: true },
                { name: '🔮 Mystery Layers', value: `${gameStats.mysteryLayersUnlocked} / 7`, inline: true }
            ]
        };
        if (playerData.player) {
            embed.fields.push({ name: '💵 Your Earnings', value: `$${playerData.player.totalEarnings.toLocaleString()}`, inline: true }, { name: '📊 Your Equity', value: `${playerData.player.equityPercentage.toFixed(4)}%`, inline: true }, { name: '🏆 Your Rank', value: `#${playerData.rank}`, inline: true });
        }
        await ctx.reply({ embeds: [embed] });
    }
    async billionAgentInfo(ctx, user) {
        const playerData = await this.billionDollarGame.getPlayerData(user.id);
        if (!playerData.agent) {
            await ctx.reply('❌ You haven\'t joined the game yet!');
            return;
        }
        const agent = playerData.agent;
        const embed = {
            title: `🤖 ${agent.name}`,
            color: 0x667eea,
            fields: [
                { name: '⚡ Type', value: agent.type, inline: true },
                { name: '📊 Level', value: agent.level.toString(), inline: true },
                { name: '⭐ XP', value: agent.experience.toString(), inline: true },
                { name: '💵 Daily Output', value: `$${agent.dailyOutput}`, inline: true },
                { name: '📈 Total Output', value: `$${agent.totalOutput}`, inline: true },
                { name: '⚙️ Efficiency', value: `${(agent.efficiency * 100).toFixed(0)}%`, inline: true }
            ]
        };
        if (agent.specialAbilities.length > 0) {
            embed.fields.push({
                name: '🎯 Special Abilities',
                value: agent.specialAbilities.join(', ')
            });
        }
        await ctx.reply({ embeds: [embed] });
    }
    async billionHelp(ctx) {
        const embed = {
            title: '💰 Billion Dollar Game',
            description: 'Join the collective quest to reach $1 billion with AI agents!',
            color: 0x667eea,
            fields: [
                { name: 'billion join', value: 'Join the game (100 tokens)' },
                { name: 'billion status', value: 'View game progress' },
                { name: 'billion agent', value: 'View your AI agent info' }
            ],
            footer: '7 mystery layers await discovery...'
        };
        await ctx.reply({ embeds: [embed] });
    }
    getCommand(name) {
        const resolvedName = this.aliases.get(name) || name;
        return this.commands.get(resolvedName);
    }
    getAllCommands() {
        return Array.from(this.commands.values());
    }
}
exports.UnifiedCommandsService = UnifiedCommandsService;
//# sourceMappingURL=unified-commands.service.js.map