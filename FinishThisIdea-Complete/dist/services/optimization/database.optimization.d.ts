import { PrismaClient } from '@prisma/client';
export interface QueryOptimizationOptions {
    cache?: boolean;
    cacheTtl?: number;
    maxRetries?: number;
    timeout?: number;
    batchSize?: number;
}
export interface DatabasePerformanceMetrics {
    queryCount: number;
    avgQueryTime: number;
    slowQueries: Array<{
        query: string;
        duration: number;
        timestamp: Date;
    }>;
    cacheHitRate: number;
    connectionPoolStats: {
        active: number;
        idle: number;
        total: number;
    };
}
export declare class DatabaseOptimizationService {
    private prisma;
    private slowQueryThreshold;
    private slowQueries;
    private queryStats;
    constructor(prisma: PrismaClient);
    private setupQueryMonitoring;
    private sanitizeQuery;
    optimizedFindMany<T>(model: string, args?: any, options?: QueryOptimizationOptions): Promise<T[]>;
    optimizedFindUnique<T>(model: string, args: any, options?: QueryOptimizationOptions): Promise<T | null>;
    batchCreate<T>(model: string, data: any[], options?: QueryOptimizationOptions): Promise<T[]>;
    optimizedAggregate(model: string, args: any, options?: QueryOptimizationOptions): Promise<any>;
    optimizedTransaction<T>(fn: (tx: any) => Promise<T>, options?: QueryOptimizationOptions): Promise<T>;
    private executeWithTimeout;
    private executeWithRetry;
    private isNonRetryableError;
    invalidateModelCache(model: string): Promise<void>;
    getPerformanceMetrics(): DatabasePerformanceMetrics;
    optimizeQueryPlan(model: string, query: any): Promise<string[]>;
    healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        metrics: DatabasePerformanceMetrics;
        recommendations: string[];
    }>;
}
export declare const databaseOptimization: DatabaseOptimizationService;
//# sourceMappingURL=database.optimization.d.ts.map