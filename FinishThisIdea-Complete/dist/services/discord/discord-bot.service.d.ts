import { EventEmitter } from 'events';
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
export declare class DiscordBotService extends EventEmitter {
    private client;
    private prisma;
    private gamificationService;
    private aiService;
    private paymentService;
    private emailQueue;
    private config;
    private commands;
    private cooldowns;
    constructor(config: DiscordConfig);
    start(): Promise<void>;
    private setupCommands;
    private setupEventHandlers;
    private setActivity;
    private helpCommand;
    private registerCommand;
    private profileCommand;
    private analyzeCommand;
    private dailyBonusCommand;
    private leaderboardCommand;
    private handleButtonInteraction;
    private handleNewMember;
    private ensureRegistered;
    private getUserByDiscordId;
    private createUser;
    private getUserStats;
    private updateUserStats;
    private getGlobalStats;
    private fetchCodeFromUrl;
    private isSameDay;
    private isOnCooldown;
    private setCooldown;
    private aiCommand;
    private shopCommand;
    private statsCommand;
    private pricingCommand;
    private apiInfoCommand;
}
export {};
//# sourceMappingURL=discord-bot.service.d.ts.map