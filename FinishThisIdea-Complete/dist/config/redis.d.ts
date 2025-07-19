import Redis from 'ioredis';
import Bull from 'bull';
declare let redis: Redis;
export default redis;
export declare function checkRedisConnection(): Promise<boolean>;
export declare class RedisCache {
    static get<T>(key: string): Promise<T | null>;
    static set<T>(key: string, value: T, ttl?: number): Promise<boolean>;
    static del(key: string): Promise<boolean>;
    static exists(key: string): Promise<boolean>;
    static keys(pattern: string): Promise<string[]>;
    static incr(key: string): Promise<number>;
    static expire(key: string, ttl: number): Promise<boolean>;
}
export declare class RedisSession {
    private static getKey;
    static get(sessionId: string): Promise<any | null>;
    static set(sessionId: string, data: any, ttl?: number): Promise<boolean>;
    static destroy(sessionId: string): Promise<boolean>;
    static refresh(sessionId: string, ttl?: number): Promise<boolean>;
}
export declare class RedisRateLimit {
    static checkLimit(key: string, limit: number, window: number): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: number;
    }>;
}
export declare const cleanupQueue: Bull.Queue<any>;
export declare const emailQueue: Bull.Queue<any>;
export declare const notificationQueue: Bull.Queue<any>;
export declare class RedisAdvancedRateLimit {
    static slidingWindowLimit(key: string, limit: number, windowMs: number): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: number;
        hits: number;
    }>;
    static tokenBucketLimit(key: string, capacity: number, refillRate: number, tokensRequested?: number): Promise<{
        allowed: boolean;
        tokensRemaining: number;
        nextRefillTime: number;
    }>;
}
export declare class RedisLock {
    static acquireLock(key: string, ttl?: number, identifier?: string): Promise<string | null>;
    static releaseLock(key: string, identifier: string): Promise<boolean>;
    static extendLock(key: string, identifier: string, ttl: number): Promise<boolean>;
}
export declare class RedisPubSub {
    private static subscribers;
    static publish(channel: string, message: any): Promise<number>;
    static subscribe(channel: string, callback: (message: any, channel: string) => void): Promise<void>;
    static unsubscribe(channel: string): Promise<void>;
    static unsubscribeAll(): Promise<void>;
}
export declare function cleanupTestRedis(): Promise<void>;
//# sourceMappingURL=redis.d.ts.map