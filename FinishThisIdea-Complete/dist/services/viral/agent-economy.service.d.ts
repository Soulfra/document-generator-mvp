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
declare class AgentEconomyService {
    private agentTemplates;
    private userAgents;
    private collaborations;
    constructor();
    private initializeAgentTemplates;
    mintAgent(userId: string, templateId: string, customName?: string, metadata?: any): Promise<UserAgent>;
    getAgentTemplates(): AgentTemplate[];
    getUserAgents(userId: string): UserAgent[];
    getPublicAgents(): UserAgent[];
    startCollaboration(projectId: string, participantAgents: {
        agentId: string;
        role: string;
    }[]): Promise<AgentCollaboration>;
    completeCollaboration(collaborationId: string, outcome: 'success' | 'partial' | 'failed', revenueGenerated?: number): Promise<void>;
    getMarketplaceStats(): Promise<any>;
    makeAgentPublic(agentId: string, userId: string): Promise<void>;
    getCollaborationHistory(): AgentCollaboration[];
}
export declare const agentEconomyService: AgentEconomyService;
export {};
//# sourceMappingURL=agent-economy.service.d.ts.map