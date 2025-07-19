#!/usr/bin/env node
import { EventEmitter } from 'events';
interface VaultConfiguration {
    maxConcurrentActions: number;
    dailyActionLimit: number;
    monthlyExportQuota: number;
    reflectionDelayThreshold: number;
    witnessValidationRequired: boolean;
    platformForkPermissions: boolean;
    calCustomizationLevel: string;
}
interface VaultMetrics {
    totalVaults: number;
    activeVaults: number;
    averageTrustScore: number;
    totalActionsToday: number;
    totalRevenueGenerated: number;
    witnessValidationSuccess: number;
    complianceScore: number;
}
export declare class EnterpriseVaultSovereigntyIntegration extends EventEmitter {
    private vaultProcesses;
    private vaultConnections;
    private vaultStatus;
    private vaultData;
    private masterKey;
    private soulfraBasePath;
    private vaultPaths;
    constructor();
    initializeVaultSovereignty(): Promise<void>;
    private loadVaultConfigurations;
    private initializeCryptographicSovereignty;
    private startVaultServices;
    private startVaultService;
    private connectToVaultSystems;
    private handleVaultMessage;
    private initializeAPIKeyVault;
    getVaultMetrics(): Promise<VaultMetrics>;
    createEnterpriseVault(enterpriseId: string, tier: string, config: VaultConfiguration): Promise<any>;
    storeAPIKey(serviceName: string, keyName: string, apiKey: string, options?: any): Promise<any>;
    retrieveAPIKey(serviceName: string, keyName: string, userId?: string): Promise<any>;
    rotateAPIKey(serviceName: string, keyName: string, newApiKey: string, userId?: string): Promise<any>;
    exportVaultData(vaultId: string, exportType: string): Promise<any>;
    getComplianceStatus(): Promise<any>;
    getSovereigntyStatus(vaultId?: string): Promise<any>;
    private generateMasterKey;
    private encryptData;
    private decryptData;
    private generateED25519KeyPair;
    private generateSecp256k1KeyPair;
    private generateDeviceFingerprint;
    private handleWitnessValidation;
    private handleSovereigntyEvent;
    private handleComplianceAlert;
    private handleVaultSync;
    getVaultHealth(): Promise<Record<string, boolean>>;
    shutdown(): Promise<void>;
}
export default EnterpriseVaultSovereigntyIntegration;
//# sourceMappingURL=enterprise-vault-sovereignty.integration.d.ts.map