import * as QRCode from 'qrcode';
interface QRCodeData {
    id: string;
    type: 'referral' | 'auth' | 'share' | 'session';
    data: any;
    expires: Date;
    metadata?: {
        userId?: string;
        source?: string;
        campaign?: string;
    };
}
interface QRCodeOptions {
    type?: QRCode.QRCodeToDataURLOptions['type'];
    quality?: number;
    margin?: number;
    color?: {
        dark?: string;
        light?: string;
    };
    width?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}
export declare class QRService {
    private static instance;
    private readonly defaultExpiry;
    static getInstance(): QRService;
    generateReferralQR(referralCode: string, baseUrl?: string, options?: QRCodeOptions): Promise<{
        id: string;
        dataUrl: string;
        url: string;
    }>;
    generateAuthQR(sessionData: any, expiryMinutes?: number): Promise<{
        id: string;
        dataUrl: string;
    }>;
    generateShareQR(shareUrl: string, metadata?: any, options?: QRCodeOptions): Promise<{
        id: string;
        dataUrl: string;
    }>;
    private generateQRCode;
    private storeQRData;
    getQRData(qrId: string): Promise<QRCodeData | null>;
    deleteQRData(qrId: string): Promise<void>;
    trackQRScan(qrId: string, metadata?: any): Promise<void>;
    getQRAnalytics(qrId: string): Promise<{
        scans: number;
        lastScan?: Date;
        data: QRCodeData | null;
    }>;
    cleanupExpiredQRCodes(): Promise<number>;
    generateBrandedQR(data: string, logoUrl?: string, options?: QRCodeOptions): Promise<string>;
}
export declare const qrService: QRService;
export {};
//# sourceMappingURL=qr.service.d.ts.map