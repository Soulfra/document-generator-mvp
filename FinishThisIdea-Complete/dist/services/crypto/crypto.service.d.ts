export interface CryptoConfig {
    algorithm: string;
    keyLength: number;
    saltLength: number;
    iterations: number;
    hmacAlgorithm: string;
    encryptionAlgorithm: string;
    ivLength: number;
}
export declare class CryptoService {
    private static instance;
    private config;
    private encryptionKey;
    constructor(config?: Partial<CryptoConfig>);
    static getInstance(config?: Partial<CryptoConfig>): CryptoService;
    generateRandomBytes(length: number): Buffer;
    generateSecureToken(length?: number): string;
    generateApiKey(prefix?: string): string;
    validateApiKeyFormat(apiKey: string): boolean;
    hash(data: string | Buffer): string;
    hashWithSalt(data: string, salt?: string): Promise<string>;
    verifyHash(data: string, hashedData: string): Promise<boolean>;
    generateHMAC(data: string | Buffer, secret: string): string;
    verifyHMAC(data: string | Buffer, signature: string, secret: string): boolean;
    generateWebhookSignature(payload: any, secret: string): {
        signature: string;
        timestamp: number;
        header: string;
    };
    verifyWebhookSignature(payload: any, signatureHeader: string, secret: string, maxAgeSeconds?: number): boolean;
    encrypt(data: string | Buffer): {
        encrypted: string;
        iv: string;
        tag: string;
    };
    decrypt(encryptedData: string, iv: string, tag: string): string;
    generateRequestSignature(method: string, path: string, body: any, timestamp: number, apiKey: string, apiSecret: string): string;
    verifyRequestSignature(method: string, path: string, body: any, timestamp: number, apiKey: string, apiSecret: string, providedSignature: string, maxAgeSeconds?: number): boolean;
    generateEntropy(bits?: number): string;
    private deriveKeySync;
    private generateChecksum;
    constantTimeCompare(a: string, b: string): boolean;
    generateMultipartSignature(parts: Array<{
        name: string;
        value: string;
    }>, secret: string): string;
}
export declare const cryptoService: CryptoService;
//# sourceMappingURL=crypto.service.d.ts.map