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
    /**
     * Generate QR code for user authentication/onboarding
     */
    generateQRCode(sessionId: string, metadata?: any): Promise<any>;
    /**
     * Validate and process QR code scan
     */
    validateQRCode(uuid: string): Promise<QRCodeData | null>;
    /**
     * Complete QR authentication - create user session
     */
    completeQRAuth(uuid: string, userInfo?: any): Promise<any>;
    /**
     * Generate QR code specifically for file sharing/project collaboration
     */
    generateProjectShareQR(projectId: string, uploadId: string, permissions?: string[]): Promise<any>;
    /**
     * Generate QR code for referral/viral sharing
     */
    generateReferralQR(referrerId: string, incentive?: string): Promise<any>;
    private generateSecureUserId;
    private generateAuthToken;
    /**
     * Get QR authentication statistics
     */
    getQRStats(): Promise<any>;
    /**
     * Cleanup expired QR codes
     */
    cleanupExpiredQRCodes(): Promise<number>;
}
export declare const qrAuthService: QRAuthService;
export {};
//# sourceMappingURL=qr-auth.service.d.ts.map