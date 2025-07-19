export interface CacheConfig {
    ttl: number;
    checkPeriod?: number;
    useRedis?: boolean;
    prefix?: string;
}
export interface CacheOptions {
    ttl?: number;
    tags?: string[];
    compress?: boolean;
    serialize?: boolean;
}
export declare class CacheService {
    private nodeCache;
    private redisService;
    private defaultConfig;
    private cacheHits;
    private cacheMisses;
    constructor(config?: CacheConfig);
    private setupEventListeners;
    get<T>(key: string, options?: CacheOptions): Promise<T | null>;
    set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean>;
    delete(key: string, options?: CacheOptions): Promise<boolean>;
    invalidateByTag(tag: string): Promise<number>;
    invalidateByPattern(pattern: string): Promise<number>;
    clear(): Promise<void>;
    memoize<T extends (...args: any[]) => any>(fn: T, keyGenerator: (...args: Parameters<T>) => string, options?: CacheOptions): T;
    getStats(): {
        memory: {
            keys: number;
            hits: number;
            misses: number;
            hitRate: number;
        };
        redis: {
            connected: boolean;
        };
    };
    private buildKey;
    private getFromRedis;
    private setInRedis;
    private storeTags;
    private cleanupTags;
    private getValueSize;
}
export declare const cacheService: CacheService;
export declare const apiCache: CacheService;
export declare const dbCache: CacheService;
export declare const fileCache: CacheService;
//# sourceMappingURL=cache.service.d.ts.map