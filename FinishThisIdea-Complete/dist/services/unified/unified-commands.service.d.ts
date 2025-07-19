import { EventEmitter } from 'events';
interface CommandContext {
    platform: 'discord' | 'telegram';
    userId: string;
    username: string;
    channelId: string;
    guildId?: string;
    messageId: string;
    args: string[];
    rawMessage: string;
    reply: (content: string | CommandReply) => Promise<void>;
    react: (emoji: string) => Promise<void>;
    isAdmin: boolean;
    platformContext: any;
}
interface CommandReply {
    content?: string;
    embeds?: CommandEmbed[];
    buttons?: CommandButton[][];
    ephemeral?: boolean;
}
interface CommandEmbed {
    title?: string;
    description?: string;
    color?: number | string;
    fields?: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
    thumbnail?: string;
    image?: string;
    footer?: string;
    timestamp?: boolean;
}
interface CommandButton {
    label: string;
    customId?: string;
    url?: string;
    emoji?: string;
    style?: 'primary' | 'secondary' | 'success' | 'danger' | 'link';
    disabled?: boolean;
}
interface Command {
    name: string;
    aliases?: string[];
    description: string;
    category: CommandCategory;
    usage?: string;
    examples?: string[];
    cooldown?: number;
    adminOnly?: boolean;
    guildOnly?: boolean;
    dmOnly?: boolean;
    platforms?: ('discord' | 'telegram')[];
    execute: (ctx: CommandContext) => Promise<void>;
}
type CommandCategory = 'general' | 'account' | 'analysis' | 'project' | 'game' | 'economy' | 'admin';
export declare class UnifiedCommandsService extends EventEmitter {
    private commands;
    private aliases;
    private cooldowns;
    private gamificationService;
    private aiService;
    private projectService;
    private paymentService;
    private arenaService;
    private billionDollarGame;
    constructor();
    private registerCommands;
    executeCommand(commandName: string, context: CommandContext): Promise<void>;
    private helpCommand;
    private pingCommand;
    private statsCommand;
    private profileCommand;
    private balanceCommand;
    private dailyCommand;
    private leaderboardCommand;
    private analyzeCommand;
    private cleanupCommand;
    private aiCommand;
    private arenaCommand;
    private billionCommand;
    private checkCooldown;
    private setCooldown;
    private getCommandsByCategory;
    private formatCategory;
    private createProgressBar;
    private detectLanguage;
    private splitMessage;
    private ensureUser;
    private getUserByPlatformId;
    private createUser;
    private getAnalysis;
    private claimDailyBonus;
    private arenaCreateFighter;
    private arenaStartBattle;
    private arenaPlaceBet;
    private arenaRankings;
    private arenaHelp;
    private billionJoinGame;
    private billionGameStatus;
    private billionAgentInfo;
    private billionHelp;
    getCommand(name: string): Command | undefined;
    getAllCommands(): Command[];
}
export {};
//# sourceMappingURL=unified-commands.service.d.ts.map