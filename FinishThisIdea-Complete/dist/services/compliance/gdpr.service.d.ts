import { Request, Response, NextFunction } from 'express';
export interface ConsentRecord {
    id: string;
    userId: string;
    consentType: ConsentType;
    purpose: string;
    granted: boolean;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    expiresAt?: Date;
    withdrawnAt?: Date;
    version: string;
}
export interface DataExportRequest {
    id: string;
    userId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    requestedAt: Date;
    completedAt?: Date;
    downloadUrl?: string;
    expiresAt?: Date;
}
export interface DataDeletionRequest {
    id: string;
    userId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    requestedAt: Date;
    completedAt?: Date;
    anonymizationLevel: 'partial' | 'full';
    retainedData: string[];
}
export type ConsentType = 'essential' | 'analytics' | 'marketing' | 'personalization' | 'third_party' | 'ai_training' | 'data_sharing' | 'location' | 'cookies_functional' | 'cookies_analytics' | 'cookies_marketing';
export interface ComplianceConfig {
    consentVersion: string;
    dataRetentionDays: number;
    anonymizationDelayDays: number;
    exportExpirationDays: number;
    enableConsentBanners: boolean;
    enableDataMinimization: boolean;
    enableAutomaticDeletion: boolean;
    requiredConsents: ConsentType[];
    optionalConsents: ConsentType[];
}
export declare class GDPRComplianceService {
    private static instance;
    private config;
    constructor(config?: Partial<ComplianceConfig>);
    static getInstance(config?: Partial<ComplianceConfig>): GDPRComplianceService;
    recordConsent(userId: string, consentType: ConsentType, granted: boolean, purpose: string, req: Request): Promise<ConsentRecord>;
    getUserConsent(userId: string, consentType?: ConsentType): Promise<ConsentRecord[]>;
    withdrawConsent(userId: string, consentType: ConsentType, req: Request): Promise<void>;
    hasValidConsent(userId: string, consentType: ConsentType): Promise<boolean>;
    createDataExportRequest(userId: string): Promise<DataExportRequest>;
    processDataExport(requestId: string): Promise<void>;
    createDataDeletionRequest(userId: string, anonymizationLevel?: 'partial' | 'full'): Promise<DataDeletionRequest>;
    consentMiddleware(requiredConsents: ConsentType[]): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    private calculateConsentExpiry;
    private queueDataExport;
    private collectUserData;
    private storeExportFile;
    private getRetainedDataFields;
    private scheduleDeletion;
    private cleanupAnalyticsData;
    getPendingExportRequest(userId: string): Promise<DataExportRequest | null>;
    getUserExportRequests(userId: string): Promise<DataExportRequest[]>;
    getExportRequest(requestId: string): Promise<DataExportRequest | null>;
    generateSecureDownloadUrl(requestId: string, userId: string): Promise<string>;
    getPendingDeletionRequest(userId: string): Promise<DataDeletionRequest | null>;
    getUserDeletionRequests(userId: string): Promise<DataDeletionRequest[]>;
    cancelDeletionRequest(requestId: string, userId: string): Promise<boolean>;
    getUserDataAccessLog(userId: string, options?: {
        page?: number;
        limit?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        records: any[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getPrivacyPolicyStatus(userId: string): Promise<{
        accepted: boolean;
        version: string;
        acceptedAt?: Date;
        current: boolean;
    }>;
    acceptPrivacyPolicy(userId: string, version: string, req: Request): Promise<void>;
    logDataAccess(userId: string, dataType: string, action: 'read' | 'write' | 'delete', details: any, req: Request): Promise<void>;
    dataAccessMiddleware(dataType: string, action: 'read' | 'write' | 'delete'): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    cleanupExpiredConsents(): Promise<number>;
}
export declare const gdprService: GDPRComplianceService;
//# sourceMappingURL=gdpr.service.d.ts.map