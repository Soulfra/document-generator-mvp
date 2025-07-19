interface AgentTemplate {
    id: string;
    name: string;
    description: string;
    specialization: string;
    capabilities: string[];
    modelPreferences: string[];
    personalityTraits: string[];
    codeStyle: string;
    experienceLevel: 'junior' | 'mid' | 'senior' | 'expert';
    pricePerToken: number;
}
interface UserAgent {
    id: string;
    templateId: string;
    ownerId: string;
    customName: string;
    experience: number;
    specializations: string[];
    reputation: number;
    earnings: number;
    isPublic: boolean;
    collaborations: number;
    createdAt: Date;
    lastUsed: Date;
}
interface AgentCollaboration {
    id: string;
    projectId: string;
    participants: {
        agentId: string;
        ownerId: string;
        role: string;
        contribution: number;
    }[];
    startedAt: Date;
    completedAt?: Date;
    outcome: 'success' | 'partial' | 'failed';
    revenueGenerated: number;
}
/**
 * Agent Economy Service - Viral AI Agent Creation and Collaboration
 * Inspired by Soulfra's AgentEconomy system for viral growth
 */
declare class AgentEconomyService {
    private agentTemplates;
    private userAgents;
    private collaborations;
    constructor();
    /**
     * Initialize predefined agent templates for minting
     */
    private initializeAgentTemplates;
    /**
     * Mint a new AI agent for a user (viral growth mechanic)
     */
    mintAgent(userId: string, templateId: string, customName?: string, metadata?: any): Promise<UserAgent>;
    /**
     * Get available agent templates for minting
     */
    getAgentTemplates(): AgentTemplate[];
    /**
     * Get user's agents
     */
    getUserAgents(userId: string): UserAgent[];
    /**
     * Get public agents available for collaboration
     */
    getPublicAgents(): UserAgent[];
    /**
     * Start agent collaboration on a project (viral network effect)
     */
    startCollaboration(projectId: string, participantAgents: {
        agentId: string;
        role: string;
    }[]): Promise<AgentCollaboration>;
    /**
     * Complete agent collaboration and distribute rewards
     */
    completeCollaboration(collaborationId: string, outcome: 'success' | 'partial' | 'failed', revenueGenerated?: number): Promise<void>;
    /**
     * Get agent marketplace stats
     */
    getMarketplaceStats(): Promise<any>;
    /**
     * Make agent public for collaboration
     */
    makeAgentPublic(agentId: string, userId: string): Promise<void>;
    /**
     * Get collaboration history for analytics
     */
    getCollaborationHistory(): AgentCollaboration[];
}
export declare const agentEconomyService: AgentEconomyService;
export {};
//# sourceMappingURL=agent-economy.service.d.ts.map