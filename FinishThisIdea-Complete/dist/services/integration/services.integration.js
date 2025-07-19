"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.servicesIntegration = exports.ServicesIntegration = void 0;
const logger_1 = require("../../utils/logger");
const discord_bot_service_1 = require("../discord/discord-bot.service");
const enterprise_analytics_service_1 = require("../analytics/enterprise-analytics.service");
const platform_licensing_service_1 = require("../licensing/platform-licensing.service");
const github_automation_service_1 = require("../github/github-automation.service");
const multi_tenant_service_1 = require("../multi-tenant/multi-tenant.service");
const gamification_service_1 = require("../gamification/gamification.service");
const service_generator_1 = require("../generator/service-generator");
const telegram_bot_service_1 = require("../telegram/telegram-bot.service");
const ai_arena_service_1 = require("../ai-arena/ai-arena.service");
const smart_routing_daemon_1 = require("../routing/smart-routing-daemon");
const webhook_service_1 = require("../webhook/webhook.service");
const dashboard_service_1 = require("../dashboard/dashboard.service");
const billion_dollar_game_service_1 = require("../game/billion-dollar-game.service");
const unified_commands_service_1 = require("../unified/unified-commands.service");
const game_state_service_1 = require("../game-state/game-state.service");
class ServicesIntegration {
    discordBot;
    analytics;
    licensing;
    githubAutomation;
    multiTenant;
    gamification;
    serviceGenerator;
    telegramBot;
    aiArena;
    smartRouting;
    webhookService;
    dashboardService;
    billionDollarGame;
    unifiedCommands;
    gameStateService;
    async initialize() {
        logger_1.logger.info('Initializing all integrated services from Soulfra-AgentZero (Phase 1, 2 & 3)');
        try {
            await this.initializeMultiTenant();
            await this.initializeGamification();
            await this.initializeLicensing();
            await this.initializeDiscordBot();
            await this.initializeTelegramBot();
            await this.initializeAnalytics();
            await this.initializeGitHubAutomation();
            await this.initializeServiceGenerator();
            await this.initializeAIArena();
            await this.initializeSmartRouting();
            await this.initializeWebhookService();
            await this.initializeDashboardService();
            await this.initializeBillionDollarGame();
            await this.initializeUnifiedCommands();
            await this.initializeGameStateService();
            await this.setupServiceIntegrations();
            logger_1.logger.info('All services initialized successfully across all phases');
        }
        catch (error) {
            logger_1.logger.error('Error initializing services', error);
            throw error;
        }
    }
    async initializeDiscordBot() {
        if (!process.env.DISCORD_BOT_TOKEN) {
            logger_1.logger.warn('Discord bot token not configured, skipping Discord integration');
            return;
        }
        this.discordBot = new discord_bot_service_1.DiscordBotService({
            botToken: process.env.DISCORD_BOT_TOKEN,
            commandPrefix: process.env.DISCORD_PREFIX || '!',
            guildId: process.env.DISCORD_GUILD_ID,
            channels: {
                welcome: process.env.DISCORD_WELCOME_CHANNEL,
                announcements: process.env.DISCORD_ANNOUNCEMENTS_CHANNEL,
                support: process.env.DISCORD_SUPPORT_CHANNEL,
                showcase: process.env.DISCORD_SHOWCASE_CHANNEL
            }
        });
        await this.discordBot.start();
        logger_1.logger.info('Discord bot service initialized');
    }
    async initializeAnalytics() {
        this.analytics = new enterprise_analytics_service_1.EnterpriseAnalyticsService();
        await this.analytics.start();
        this.analytics.on('metrics-updated', (metrics) => {
            logger_1.logger.debug('Analytics metrics updated', {
                activeUsers: metrics.system.concurrentUsers,
                revenue: metrics.business.totalRevenue
            });
        });
        logger_1.logger.info('Enterprise Analytics service initialized');
    }
    async initializeLicensing() {
        this.licensing = new platform_licensing_service_1.PlatformLicensingService();
        this.licensing.on('license-activated', (license) => {
            logger_1.logger.info('License activated', {
                licenseId: license.id,
                type: license.type
            });
            if (this.analytics) {
                const metrics = this.analytics.getMetrics();
                metrics.business.activeSubscriptions++;
                metrics.business.totalRevenue += license.billing.amount;
            }
        });
        this.licensing.on('limit-exceeded', async (event) => {
            logger_1.logger.warn('License limit exceeded', event);
            if (this.discordBot) {
            }
        });
        logger_1.logger.info('Platform Licensing service initialized');
    }
    async initializeGitHubAutomation() {
        if (!process.env.GITHUB_TOKEN) {
            logger_1.logger.warn('GitHub token not configured, skipping GitHub automation');
            return;
        }
        this.githubAutomation = new github_automation_service_1.GitHubAutomationService({
            token: process.env.GITHUB_TOKEN,
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO
        });
        logger_1.logger.info('GitHub Automation service initialized');
    }
    async initializeMultiTenant() {
        this.multiTenant = new multi_tenant_service_1.MultiTenantService();
        this.multiTenant.on('tenant-created', (event) => {
            logger_1.logger.info('New tenant created', event);
        });
        this.multiTenant.on('resource-warning', (event) => {
            logger_1.logger.warn('Tenant resource warning', event);
        });
        logger_1.logger.info('Multi-Tenant service initialized');
    }
    async initializeGamification() {
        this.gamification = new gamification_service_1.GamificationService();
        this.gamification.on('achievements-unlocked', async (event) => {
            logger_1.logger.info('Achievements unlocked', {
                userId: event.userId,
                count: event.achievements.length
            });
            if (this.discordBot) {
            }
        });
        this.gamification.on('level-up', async (event) => {
            logger_1.logger.info('User leveled up', event);
        });
        logger_1.logger.info('Gamification service initialized');
    }
    async initializeServiceGenerator() {
        this.serviceGenerator = new service_generator_1.ServiceGenerator();
        logger_1.logger.info('Service Generator initialized');
    }
    async initializeTelegramBot() {
        if (!process.env.TELEGRAM_BOT_TOKEN) {
            logger_1.logger.warn('Telegram bot token not configured, skipping Telegram integration');
            return;
        }
        this.telegramBot = new telegram_bot_service_1.TelegramBotService({
            botToken: process.env.TELEGRAM_BOT_TOKEN,
            webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
            secretToken: process.env.TELEGRAM_SECRET_TOKEN,
            isProduction: process.env.NODE_ENV === 'production'
        });
        await this.telegramBot.start();
        logger_1.logger.info('Telegram bot service initialized');
    }
    async initializeAIArena() {
        this.aiArena = new ai_arena_service_1.AIArenaService();
        this.aiArena.on('battle-started', (event) => {
            logger_1.logger.info('AI Arena battle started', event);
            if (this.discordBot) {
            }
            if (this.telegramBot) {
            }
        });
        this.aiArena.on('battle-completed', (event) => {
            logger_1.logger.info('AI Arena battle completed', event);
            if (this.analytics) {
            }
        });
        logger_1.logger.info('AI Arena service initialized');
    }
    async initializeSmartRouting() {
        this.smartRouting = new smart_routing_daemon_1.SmartRoutingDaemon();
        this.smartRouting.on('routing-decision', (decision) => {
            logger_1.logger.debug('Routing decision made', {
                requestId: decision.requestId,
                chosenPath: decision.chosenPath,
                confidence: decision.confidence
            });
            if (this.analytics) {
            }
        });
        logger_1.logger.info('Smart Routing Daemon initialized');
    }
    async initializeWebhookService() {
        this.webhookService = new webhook_service_1.WebhookService();
        this.webhookService.on('webhook-received', (event) => {
            logger_1.logger.info('Webhook received', { type: event.type, source: event.source });
        });
        logger_1.logger.info('Webhook service initialized');
    }
    async initializeDashboardService() {
        this.dashboardService = new dashboard_service_1.DashboardService({
            port: parseInt(process.env.DASHBOARD_PORT || '8080'),
            wsPort: parseInt(process.env.DASHBOARD_WS_PORT || '8081'),
            updateInterval: 5000,
            enabledDashboards: ['consciousness', 'executive', 'system', 'economy', 'arena', 'analytics', 'gamification']
        });
        await this.dashboardService.start();
        logger_1.logger.info('Dashboard service initialized');
    }
    async initializeBillionDollarGame() {
        this.billionDollarGame = new billion_dollar_game_service_1.BillionDollarGameService();
        this.billionDollarGame.on('player-joined', (event) => {
            logger_1.logger.info('New player joined Billion Dollar Game', event);
            if (this.discordBot) {
            }
            if (this.telegramBot) {
            }
        });
        this.billionDollarGame.on('game-completed', (event) => {
            logger_1.logger.info('BILLION DOLLAR GAME COMPLETED!', event);
            if (this.discordBot) {
            }
            if (this.telegramBot) {
            }
            if (this.webhookService) {
            }
        });
        this.billionDollarGame.on('mystery-layer-unlocked', (event) => {
            logger_1.logger.info('Mystery layer unlocked', event);
            if (this.discordBot) {
            }
        });
        logger_1.logger.info('Billion Dollar Game service initialized');
    }
    async initializeUnifiedCommands() {
        this.unifiedCommands = new unified_commands_service_1.UnifiedCommandsService();
        logger_1.logger.info('Unified Commands service initialized');
    }
    async initializeGameStateService() {
        this.gameStateService = new game_state_service_1.GameStateService(parseInt(process.env.GAME_STATE_WS_PORT || '8082'));
        this.gameStateService.on('session-created', (session) => {
            logger_1.logger.info('Game session created', {
                sessionId: session.id,
                gameType: session.gameType,
                platform: session.platform
            });
        });
        logger_1.logger.info('Game State service initialized');
    }
    async setupServiceIntegrations() {
        logger_1.logger.info('Setting up cross-service integrations');
        if (this.discordBot && this.unifiedCommands) {
            this.discordBot.on('command', async (commandData) => {
                await this.unifiedCommands.executeCommand(commandData.name, {
                    platform: 'discord',
                    userId: commandData.userId,
                    username: commandData.username,
                    channelId: commandData.channelId,
                    guildId: commandData.guildId,
                    messageId: commandData.messageId,
                    args: commandData.args,
                    rawMessage: commandData.rawMessage,
                    reply: commandData.reply,
                    react: commandData.react,
                    isAdmin: commandData.isAdmin,
                    platformContext: commandData.message
                });
            });
        }
        if (this.telegramBot && this.unifiedCommands) {
            this.telegramBot.on('command', async (commandData) => {
                await this.unifiedCommands.executeCommand(commandData.name, {
                    platform: 'telegram',
                    userId: commandData.userId,
                    username: commandData.username,
                    channelId: commandData.chatId,
                    messageId: commandData.messageId,
                    args: commandData.args,
                    rawMessage: commandData.rawMessage,
                    reply: commandData.reply,
                    react: async () => { },
                    isAdmin: commandData.isAdmin,
                    platformContext: commandData.ctx
                });
            });
        }
        if (this.aiArena && this.gameStateService) {
            this.aiArena.on('battle-started', async (battle) => {
                await this.gameStateService.createSessionFromAPI(battle.fighter1.ownerId, 'arena', 'web', { battleId: battle.id, status: 'active' });
            });
        }
        if (this.billionDollarGame && this.webhookService) {
            this.billionDollarGame.on('player-joined', async (event) => {
                await this.webhookService.triggerEvent({
                    id: `bdg-join-${Date.now()}`,
                    type: 'game.billion.player.joined',
                    payload: event,
                    timestamp: new Date(),
                    source: 'billion-dollar-game'
                });
            });
        }
        if (this.analytics) {
            if (this.discordBot) {
                this.discordBot.on('message', () => {
                    this.analytics.getMetrics().user.messagesSent++;
                });
            }
            if (this.telegramBot) {
                this.telegramBot.on('message', () => {
                    this.analytics.getMetrics().user.messagesSent++;
                });
            }
            if (this.aiArena) {
                this.aiArena.on('battle-completed', () => {
                    this.analytics.getMetrics().business.totalRevenue += 10;
                });
            }
        }
        logger_1.logger.info('Cross-service integrations completed');
    }
    getServiceStatus() {
        return {
            discord: !!this.discordBot,
            analytics: !!this.analytics,
            licensing: !!this.licensing,
            githubAutomation: !!this.githubAutomation,
            multiTenant: !!this.multiTenant,
            gamification: !!this.gamification,
            serviceGenerator: !!this.serviceGenerator,
            telegram: !!this.telegramBot,
            aiArena: !!this.aiArena,
            smartRouting: !!this.smartRouting,
            webhooks: !!this.webhookService,
            dashboards: !!this.dashboardService,
            billionDollarGame: !!this.billionDollarGame,
            unifiedCommands: !!this.unifiedCommands,
            gameState: !!this.gameStateService
        };
    }
    async shutdown() {
        logger_1.logger.info('Shutting down all integrated services');
        const shutdownTasks = [];
        if (this.analytics) {
            shutdownTasks.push(this.analytics.stop());
        }
        if (this.telegramBot) {
            shutdownTasks.push(Promise.resolve(this.telegramBot.stop()));
        }
        if (this.billionDollarGame) {
            shutdownTasks.push(Promise.resolve(this.billionDollarGame.stop()));
        }
        if (this.dashboardService) {
            shutdownTasks.push(this.dashboardService.stop());
        }
        if (this.gameStateService) {
            shutdownTasks.push(this.gameStateService.stop());
        }
        await Promise.all(shutdownTasks);
        logger_1.logger.info('All services shut down successfully');
    }
    getServices() {
        return {
            discord: this.discordBot,
            analytics: this.analytics,
            licensing: this.licensing,
            githubAutomation: this.githubAutomation,
            multiTenant: this.multiTenant,
            gamification: this.gamification,
            serviceGenerator: this.serviceGenerator,
            telegram: this.telegramBot,
            aiArena: this.aiArena,
            smartRouting: this.smartRouting,
            webhooks: this.webhookService,
            dashboards: this.dashboardService,
            billionDollarGame: this.billionDollarGame,
            unifiedCommands: this.unifiedCommands,
            gameState: this.gameStateService
        };
    }
}
exports.ServicesIntegration = ServicesIntegration;
exports.servicesIntegration = new ServicesIntegration();
//# sourceMappingURL=services.integration.js.map