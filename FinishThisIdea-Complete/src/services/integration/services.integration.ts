/**
 * Services Integration
 * Integrates all services from Soulfra-AgentZero including Phase 2 & 3 implementations
 */

import { logger } from '../../utils/logger';
import { DiscordBotService } from '../discord/discord-bot.service';
import { EnterpriseAnalyticsService } from '../analytics/enterprise-analytics.service';
import { PlatformLicensingService } from '../licensing/platform-licensing.service';
import { GitHubAutomationService } from '../github/github-automation.service';
import { MultiTenantService } from '../multi-tenant/multi-tenant.service';
import { GamificationService } from '../gamification/gamification.service';
import { ServiceGenerator } from '../generator/service-generator';

// Phase 2 Services
import { TelegramBotService } from '../telegram/telegram-bot.service';
import { AIArenaService } from '../ai-arena/ai-arena.service';
import { SmartRoutingDaemon } from '../routing/smart-routing-daemon';

// Phase 3 Services
import { WebhookService } from '../webhook/webhook.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { BillionDollarGameService } from '../game/billion-dollar-game.service';
import { UnifiedCommandsService } from '../unified/unified-commands.service';
import { GameStateService } from '../game-state/game-state.service';

export class ServicesIntegration {
  // Core services
  private discordBot?: DiscordBotService;
  private analytics?: EnterpriseAnalyticsService;
  private licensing?: PlatformLicensingService;
  private githubAutomation?: GitHubAutomationService;
  private multiTenant?: MultiTenantService;
  private gamification?: GamificationService;
  private serviceGenerator?: ServiceGenerator;
  
  // Phase 2 services
  private telegramBot?: TelegramBotService;
  private aiArena?: AIArenaService;
  private smartRouting?: SmartRoutingDaemon;
  
  // Phase 3 services
  private webhookService?: WebhookService;
  private dashboardService?: DashboardService;
  private billionDollarGame?: BillionDollarGameService;
  private unifiedCommands?: UnifiedCommandsService;
  private gameStateService?: GameStateService;

  /**
   * Initialize all integrated services
   */
  async initialize(): Promise<void> {
    logger.info('Initializing all integrated services from Soulfra-AgentZero (Phase 1, 2 & 3)');

    try {
      // Initialize core services (Phase 1)
      await this.initializeMultiTenant();
      await this.initializeGamification();
      await this.initializeLicensing();
      
      // Initialize communication services
      await this.initializeDiscordBot();
      await this.initializeTelegramBot();
      
      // Initialize analytics
      await this.initializeAnalytics();
      
      // Initialize automation services
      await this.initializeGitHubAutomation();
      
      // Initialize service generator
      await this.initializeServiceGenerator();
      
      // Initialize Phase 2 services
      await this.initializeAIArena();
      await this.initializeSmartRouting();
      
      // Initialize Phase 3 services
      await this.initializeWebhookService();
      await this.initializeDashboardService();
      await this.initializeBillionDollarGame();
      await this.initializeUnifiedCommands();
      await this.initializeGameStateService();

      // Setup cross-service integrations
      await this.setupServiceIntegrations();

      logger.info('All services initialized successfully across all phases');
    } catch (error) {
      logger.error('Error initializing services', error);
      throw error;
    }
  }

  /**
   * Initialize Discord bot
   */
  private async initializeDiscordBot(): Promise<void> {
    if (!process.env.DISCORD_BOT_TOKEN) {
      logger.warn('Discord bot token not configured, skipping Discord integration');
      return;
    }

    this.discordBot = new DiscordBotService({
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
    logger.info('Discord bot service initialized');
  }

  /**
   * Initialize Enterprise Analytics
   */
  private async initializeAnalytics(): Promise<void> {
    this.analytics = new EnterpriseAnalyticsService();
    await this.analytics.start();
    
    // Set up analytics event listeners
    this.analytics.on('metrics-updated', (metrics) => {
      logger.debug('Analytics metrics updated', { 
        activeUsers: metrics.system.concurrentUsers,
        revenue: metrics.business.totalRevenue 
      });
    });

    logger.info('Enterprise Analytics service initialized');
  }

  /**
   * Initialize Platform Licensing
   */
  private async initializeLicensing(): Promise<void> {
    this.licensing = new PlatformLicensingService();
    
    // Set up licensing event listeners
    this.licensing.on('license-activated', (license) => {
      logger.info('License activated', { 
        licenseId: license.id,
        type: license.type 
      });
      
      // Track in analytics
      if (this.analytics) {
        const metrics = this.analytics.getMetrics();
        metrics.business.activeSubscriptions++;
        metrics.business.totalRevenue += license.billing.amount;
      }
    });

    this.licensing.on('limit-exceeded', async (event) => {
      logger.warn('License limit exceeded', event);
      
      // Notify via Discord if available
      if (this.discordBot) {
        // Send alert to admin channel
      }
    });

    logger.info('Platform Licensing service initialized');
  }

  /**
   * Initialize GitHub Automation
   */
  private async initializeGitHubAutomation(): Promise<void> {
    if (!process.env.GITHUB_TOKEN) {
      logger.warn('GitHub token not configured, skipping GitHub automation');
      return;
    }

    this.githubAutomation = new GitHubAutomationService({
      token: process.env.GITHUB_TOKEN,
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO
    });

    logger.info('GitHub Automation service initialized');
  }

  /**
   * Initialize Multi-Tenant Service
   */
  private async initializeMultiTenant(): Promise<void> {
    this.multiTenant = new MultiTenantService();
    
    this.multiTenant.on('tenant-created', (event) => {
      logger.info('New tenant created', event);
    });

    this.multiTenant.on('resource-warning', (event) => {
      logger.warn('Tenant resource warning', event);
    });

    logger.info('Multi-Tenant service initialized');
  }

  /**
   * Initialize Gamification
   */
  private async initializeGamification(): Promise<void> {
    this.gamification = new GamificationService();
    
    this.gamification.on('achievements-unlocked', async (event) => {
      logger.info('Achievements unlocked', { 
        userId: event.userId,
        count: event.achievements.length 
      });
      
      // Notify via Discord if user is connected
      if (this.discordBot) {
        // Send achievement notification
      }
    });

    this.gamification.on('level-up', async (event) => {
      logger.info('User leveled up', event);
    });

    logger.info('Gamification service initialized');
  }

  /**
   * Initialize Service Generator
   */
  private async initializeServiceGenerator(): Promise<void> {
    this.serviceGenerator = new ServiceGenerator();
    logger.info('Service Generator initialized');
  }

  /**
   * Initialize Telegram Bot (Phase 2)
   */
  private async initializeTelegramBot(): Promise<void> {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      logger.warn('Telegram bot token not configured, skipping Telegram integration');
      return;
    }

    this.telegramBot = new TelegramBotService({
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
      secretToken: process.env.TELEGRAM_SECRET_TOKEN,
      isProduction: process.env.NODE_ENV === 'production'
    });

    await this.telegramBot.start();
    logger.info('Telegram bot service initialized');
  }

  /**
   * Initialize AI Arena (Phase 2)
   */
  private async initializeAIArena(): Promise<void> {
    this.aiArena = new AIArenaService();
    
    // Set up event listeners
    this.aiArena.on('battle-started', (event) => {
      logger.info('AI Arena battle started', event);
      
      // Notify via Discord/Telegram
      if (this.discordBot) {
        // Broadcast battle start
      }
      if (this.telegramBot) {
        // Broadcast battle start
      }
    });

    this.aiArena.on('battle-completed', (event) => {
      logger.info('AI Arena battle completed', event);
      
      // Update analytics
      if (this.analytics) {
        // Track battle metrics
      }
    });

    logger.info('AI Arena service initialized');
  }

  /**
   * Initialize Smart Routing Daemon (Phase 2)
   */
  private async initializeSmartRouting(): Promise<void> {
    this.smartRouting = new SmartRoutingDaemon();
    
    this.smartRouting.on('routing-decision', (decision) => {
      logger.debug('Routing decision made', {
        requestId: decision.requestId,
        chosenPath: decision.chosenPath,
        confidence: decision.confidence
      });
      
      // Track routing metrics
      if (this.analytics) {
        // Record routing decisions
      }
    });

    logger.info('Smart Routing Daemon initialized');
  }

  /**
   * Initialize Webhook Service (Phase 3)
   */
  private async initializeWebhookService(): Promise<void> {
    this.webhookService = new WebhookService();
    
    this.webhookService.on('webhook-received', (event) => {
      logger.info('Webhook received', { type: event.type, source: event.source });
    });

    logger.info('Webhook service initialized');
  }

  /**
   * Initialize Dashboard Service (Phase 3)
   */
  private async initializeDashboardService(): Promise<void> {
    this.dashboardService = new DashboardService({
      port: parseInt(process.env.DASHBOARD_PORT || '8080'),
      wsPort: parseInt(process.env.DASHBOARD_WS_PORT || '8081'),
      updateInterval: 5000,
      enabledDashboards: ['consciousness', 'executive', 'system', 'economy', 'arena', 'analytics', 'gamification']
    });

    await this.dashboardService.start();
    logger.info('Dashboard service initialized');
  }

  /**
   * Initialize Billion Dollar Game (Phase 3)
   */
  private async initializeBillionDollarGame(): Promise<void> {
    this.billionDollarGame = new BillionDollarGameService();
    
    this.billionDollarGame.on('player-joined', (event) => {
      logger.info('New player joined Billion Dollar Game', event);
      
      // Notify via Discord/Telegram
      if (this.discordBot) {
        // Send welcome message
      }
      if (this.telegramBot) {
        // Send welcome message
      }
    });

    this.billionDollarGame.on('game-completed', (event) => {
      logger.info('BILLION DOLLAR GAME COMPLETED!', event);
      
      // Major celebration across all platforms
      if (this.discordBot) {
        // Send celebration to all channels
      }
      if (this.telegramBot) {
        // Broadcast to all users
      }
      if (this.webhookService) {
        // Trigger celebration webhooks
      }
    });

    this.billionDollarGame.on('mystery-layer-unlocked', (event) => {
      logger.info('Mystery layer unlocked', event);
      
      // Broadcast mystery unlock
      if (this.discordBot) {
        // Mysterious announcement
      }
    });

    logger.info('Billion Dollar Game service initialized');
  }

  /**
   * Initialize Unified Commands (Phase 3)
   */
  private async initializeUnifiedCommands(): Promise<void> {
    this.unifiedCommands = new UnifiedCommandsService();
    logger.info('Unified Commands service initialized');
  }

  /**
   * Initialize Game State Service (Phase 3)
   */
  private async initializeGameStateService(): Promise<void> {
    this.gameStateService = new GameStateService(
      parseInt(process.env.GAME_STATE_WS_PORT || '8082')
    );
    
    this.gameStateService.on('session-created', (session) => {
      logger.info('Game session created', {
        sessionId: session.id,
        gameType: session.gameType,
        platform: session.platform
      });
    });

    logger.info('Game State service initialized');
  }

  /**
   * Setup cross-service integrations
   */
  private async setupServiceIntegrations(): Promise<void> {
    logger.info('Setting up cross-service integrations');

    // Connect Discord and Telegram bots to unified commands
    if (this.discordBot && this.unifiedCommands) {
      // Set up Discord command delegation
      this.discordBot.on('command', async (commandData) => {
        await this.unifiedCommands!.executeCommand(commandData.name, {
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
      // Set up Telegram command delegation
      this.telegramBot.on('command', async (commandData) => {
        await this.unifiedCommands!.executeCommand(commandData.name, {
          platform: 'telegram',
          userId: commandData.userId,
          username: commandData.username,
          channelId: commandData.chatId,
          messageId: commandData.messageId,
          args: commandData.args,
          rawMessage: commandData.rawMessage,
          reply: commandData.reply,
          react: async () => {}, // Telegram doesn't have reactions like Discord
          isAdmin: commandData.isAdmin,
          platformContext: commandData.ctx
        });
      });
    }

    // Connect AI Arena to game state management
    if (this.aiArena && this.gameStateService) {
      this.aiArena.on('battle-started', async (battle) => {
        await this.gameStateService!.createSessionFromAPI(
          battle.fighter1.ownerId,
          'arena',
          'web',
          { battleId: battle.id, status: 'active' }
        );
      });
    }

    // Connect Billion Dollar Game to webhooks
    if (this.billionDollarGame && this.webhookService) {
      this.billionDollarGame.on('player-joined', async (event) => {
        await this.webhookService!.triggerEvent({
          id: `bdg-join-${Date.now()}`,
          type: 'game.billion.player.joined',
          payload: event,
          timestamp: new Date(),
          source: 'billion-dollar-game'
        });
      });
    }

    // Connect analytics to all services
    if (this.analytics) {
      // Track Discord events
      if (this.discordBot) {
        this.discordBot.on('message', () => {
          this.analytics!.getMetrics().user.messagesSent++;
        });
      }

      // Track Telegram events
      if (this.telegramBot) {
        this.telegramBot.on('message', () => {
          this.analytics!.getMetrics().user.messagesSent++;
        });
      }

      // Track AI Arena events
      if (this.aiArena) {
        this.aiArena.on('battle-completed', () => {
          this.analytics!.getMetrics().business.totalRevenue += 10; // Example revenue tracking
        });
      }
    }

    logger.info('Cross-service integrations completed');
  }

  /**
   * Get service status
   */
  getServiceStatus(): Record<string, boolean> {
    return {
      // Core services (Phase 1)
      discord: !!this.discordBot,
      analytics: !!this.analytics,
      licensing: !!this.licensing,
      githubAutomation: !!this.githubAutomation,
      multiTenant: !!this.multiTenant,
      gamification: !!this.gamification,
      serviceGenerator: !!this.serviceGenerator,
      
      // Phase 2 services
      telegram: !!this.telegramBot,
      aiArena: !!this.aiArena,
      smartRouting: !!this.smartRouting,
      
      // Phase 3 services
      webhooks: !!this.webhookService,
      dashboards: !!this.dashboardService,
      billionDollarGame: !!this.billionDollarGame,
      unifiedCommands: !!this.unifiedCommands,
      gameState: !!this.gameStateService
    };
  }

  /**
   * Shutdown all services
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down all integrated services');

    const shutdownTasks = [];

    // Core services
    if (this.analytics) {
      shutdownTasks.push(this.analytics.stop());
    }

    // Phase 2 services
    if (this.telegramBot) {
      shutdownTasks.push(Promise.resolve(this.telegramBot.stop()));
    }
    
    if (this.billionDollarGame) {
      shutdownTasks.push(Promise.resolve(this.billionDollarGame.stop()));
    }

    // Phase 3 services
    if (this.dashboardService) {
      shutdownTasks.push(this.dashboardService.stop());
    }

    if (this.gameStateService) {
      shutdownTasks.push(this.gameStateService.stop());
    }

    await Promise.all(shutdownTasks);
    logger.info('All services shut down successfully');
  }

  /**
   * Get service instances for external use
   */
  getServices() {
    return {
      // Core services (Phase 1)
      discord: this.discordBot,
      analytics: this.analytics,
      licensing: this.licensing,
      githubAutomation: this.githubAutomation,
      multiTenant: this.multiTenant,
      gamification: this.gamification,
      serviceGenerator: this.serviceGenerator,
      
      // Phase 2 services
      telegram: this.telegramBot,
      aiArena: this.aiArena,
      smartRouting: this.smartRouting,
      
      // Phase 3 services
      webhooks: this.webhookService,
      dashboards: this.dashboardService,
      billionDollarGame: this.billionDollarGame,
      unifiedCommands: this.unifiedCommands,
      gameState: this.gameStateService
    };
  }
}

// Export singleton instance
export const servicesIntegration = new ServicesIntegration();