interface QRCodeData {
    uuid: string;
    sessionId: string;
    created_at: string;
    expires_at: string;
    used?: boolean;
    used_at?: string;
    used_by?: string;
    metadata?: any;
}
declare class QRAuthService {
    private redis;
    private qrCodeExpiry;
    private baseUrl;
    private inMemoryStore;
    constructor();
    private initRedis;
    generateQRCode(sessionId: string, metadata?: any): Promise<any>;
    validateQRCode(uuid: string): Promise<QRCodeData | null>;
    completeQRAuth(uuid: string, userInfo?: any): Promise<any>;
    generateProjectShareQR(projectId: string, uploadId: string, permissions?: string[]): Promise<any>;
    generateReferralQR(referrerId: string, incentive?: string): Promise<any>;
    generateLabSessionQR(sessionId: string, profiles?: string[], storyMode?: boolean): Promise<any>;
    generateOfflineSyncQR(userId: string, syncData?: any): Promise<any>;
    generateStoryModeQR(sessionId: string, storyPreferences?: any): Promise<any>;
    generateTeamCollabQR(teamId: string, permissions?: string[], aiProfiles?: string[]): Promise<any>;
    private generateSecureUserId;
    private generateAuthToken;
    getQRStats(): Promise<any>;
    cleanupExpiredQRCodes(): Promise<number>;
}
export declare const qrAuthService: QRAuthService;
export {};
//# sourceMappingURL=qr-auth.service.d.ts.map