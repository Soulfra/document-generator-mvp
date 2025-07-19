#!/usr/bin/env node
import { EventEmitter } from 'events';
interface AgentPersonality {
    id: string;
    name: string;
    description: string;
    price: number;
    emoji: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'seasonal';
    modifications: Record<string, number>;
    special_phrases?: string[];
    special_abilities?: string[];
}
interface MarketplaceMetrics {
    total_revenue: number;
    active_agents: number;
    leagues_running: number;
    gigs_posted: number;
    total_customers: number;
    agent_exports: number;
    platform_forks: number;
}
interface LicensedVault {
    vaultId: string;
    operatorUUID: string;
    licenseType: 'individual_partner' | 'startup_partner' | 'enterprise_partner';
    totalEarned: number;
    partnerEarnings: number;
    customersServed: number;
    status: 'active' | 'suspended' | 'pending';
}
export declare class AgentMarketplaceIntegration extends EventEmitter {
    private pythonProcesses;
    private wsConnections;
    private serviceStatus;
    private marketplaceData;
    private soulfraBasePath;
    private componentPaths;
    constructor();
    initializeMarketplace(): Promise<void>;
    private loadMarketplaceConfiguration;
    private startMarketplaceServices;
    private startPythonService;
    private connectToSoulfraComponents;
    private handleSoulfraMessage;
    initializeVibeEconomy(): Promise<void>;
    getMarketplaceStatus(): Promise<MarketplaceMetrics>;
    getPersonalityStore(): Promise<{
        free_tier: AgentPersonality[];
        premium_tier: AgentPersonality[];
        legendary_tier: AgentPersonality[];
    }>;
    purchaseVibeTokens(userId: string, usdAmount: number, paymentId: string): Promise<any>;
    getVibeBalance(userId: string): Promise<number>;
    exportAgent(userId: string, agentId: string, exportType: string): Promise<any>;
    getLicensedVaults(): Promise<LicensedVault[]>;
    private handleAgentCreated;
    private handleAgentExported;
    private handleVibeTransaction;
    getServiceHealth(): Promise<Record<string, boolean>>;
    shutdown(): Promise<void>;
}
export default AgentMarketplaceIntegration;
//# sourceMappingURL=agent-marketplace.integration.d.ts.map