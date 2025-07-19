export { treasuryService } from './treasury.service';
export { agentEconomyService } from './agent-economy.service';
export { projectShowcaseService } from './project-showcase.service';
export { qrAuthService } from './qr-auth.service';
export type { RevenueOptions, AgentTemplate, UserAgent, ProjectShowcase, ShowcaseMetrics } from './types';
export { generateReferralCode, calculateTokenReward, validateShowcaseData } from './utils/viral-utils';
export declare function initializeViralServices(): Promise<void>;
export declare function getViralGrowthMetrics(): Promise<{
    treasury: any;
    agents: any;
    showcases: any;
    totalUsers: number;
    viralityScore: number;
}>;
export declare function isViralFeaturesEnabled(): boolean;
export declare function checkViralServicesHealth(): Promise<{
    treasury: boolean;
    agents: boolean;
    showcases: boolean;
    qrAuth: boolean;
    overall: boolean;
}>;
//# sourceMappingURL=index.d.ts.map