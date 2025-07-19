import { EventEmitter } from 'events';
interface TelegramConfig {
    botToken: string;
    webhookUrl?: string;
    secretToken?: string;
    isProduction?: boolean;
}
export declare class TelegramBotService extends EventEmitter {
    private bot;
    private prisma;
    private gamificationService;
    private aiService;
    private paymentService;
    private emailQueue;
    private config;
    constructor(config: TelegramConfig);
    start(): Promise<void>;
    private setupMiddleware;
    private setupCommands;
    private setupHandlers;
    private handleRegistration;
    private handleBalance;
    private handleAnalyze;
    private handleCleanup;
    private handleLeaderboard;
    private handleAI;
    private handleDailyBonus;
    private handleHelp;
    private handleStats;
    private handleCodeInput;
    private handleDocument;
    private handleGlobalStats;
    private handlePricing;
    private ensureRegistered;
    private detectLanguage;
    private splitMessage;
    private isAdmin;
    private getUserByTelegramId;
    private createUser;
    private getUserStats;
    private getPlatformStats;
    private getRecentAnalyses;
    private claimDailyBonus;
    handleWebhook(): any;
    stop(): void;
}
export {};
//# sourceMappingURL=telegram-bot.service.d.ts.map