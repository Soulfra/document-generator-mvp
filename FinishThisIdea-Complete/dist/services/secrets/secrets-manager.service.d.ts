import { EventEmitter } from 'events';
export interface Secret {
    id: string;
    name: string;
    value: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
    metadata?: Record<string, any>;
    tags?: string[];
}
export interface EncryptedSecret {
    id: string;
    name: string;
    encrypted: string;
    iv: string;
    tag: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
    metadata?: Record<string, any>;
    tags?: string[];
}
export interface SecretsConfig {
    storageBackend: 'redis' | 'file' | 'memory';
    encryptionEnabled: boolean;
    rotationCheckInterval: number;
    defaultTTL: number;
    auditEnabled: boolean;
    cacheEnabled: boolean;
    cacheTTL: number;
}
export declare class SecretsManagerService extends EventEmitter {
    private static instance;
    private config;
    private cache;
    private rotationCallbacks;
    private fileStoragePath;
    constructor(config?: Partial<SecretsConfig>);
    static getInstance(config?: Partial<SecretsConfig>): SecretsManagerService;
    setSecret(name: string, value: string, options?: {
        ttl?: number;
        metadata?: Record<string, any>;
        tags?: string[];
        overwrite?: boolean;
    }): Promise<Secret>;
    getSecret(name: string, options?: {
        version?: number;
        skipCache?: boolean;
    }): Promise<Secret | null>;
    updateSecret(name: string, value: string, metadata?: Record<string, any>): Promise<Secret>;
    deleteSecret(name: string): Promise<void>;
    listSecrets(options?: {
        tags?: string[];
        prefix?: string;
        includeExpired?: boolean;
    }): Promise<Array<Omit<Secret, 'value'>>>;
    registerRotationCallback(name: string, callback: (newValue: string) => Promise<void>): void;
    rotateSecret(name: string, generator?: () => string | Promise<string>): Promise<Secret>;
    importSecrets(secrets: Array<{
        name: string;
        value: string;
        metadata?: any;
    }>): Promise<number>;
    exportSecrets(options?: {
        unmask?: boolean;
    }): Promise<Array<Partial<Secret>>>;
    private store;
    private retrieve;
    private remove;
    private list;
    private storeInRedis;
    private retrieveFromRedis;
    private removeFromRedis;
    private listFromRedis;
    private initFileStorage;
    private storeInFile;
    private retrieveFromFile;
    private removeFromFile;
    private listFromFile;
    private memoryStore;
    private storeInMemory;
    private retrieveFromMemory;
    private removeFromMemory;
    private listFromMemory;
    private encryptSecret;
    private decryptSecret;
    private cacheSecret;
    private getCachedSecret;
    private invalidateCache;
    private maskValue;
    private auditLog;
    private checkRotations;
}
export declare const secretsManager: SecretsManagerService;
//# sourceMappingURL=secrets-manager.service.d.ts.map