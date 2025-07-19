export interface PerformanceMetrics {
    timestamp: number;
    duration: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    eventLoopDelay: number;
    activeHandles: number;
    activeRequests: number;
}
export interface PerformanceThresholds {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    eventLoopDelay: number;
}
export declare class PerformanceService {
    private metrics;
    private maxMetricsHistory;
    private monitoringInterval?;
    private performanceObserver?;
    private lastCpuUsage;
    private defaultThresholds;
    constructor();
    private startMonitoring;
    private setupPerformanceObserver;
    private collectMetrics;
    private checkThresholds;
    private cleanupMetrics;
    measure<T>(name: string, fn: () => T): T;
    measure<T>(name: string, fn: () => Promise<T>): Promise<T>;
    measureAsync<T>(name: string, fn: () => Promise<T>, options?: {
        includeMemory?: boolean;
        cacheResult?: boolean;
    }): Promise<T>;
    getStats(timeframe?: number): {
        summary: {
            avgResponseTime: number;
            maxResponseTime: number;
            avgMemoryUsage: number;
            maxMemoryUsage: number;
            avgCpuUsage: number;
            avgEventLoopDelay: number;
        };
        recent: PerformanceMetrics[];
        trends: {
            memoryTrend: 'increasing' | 'decreasing' | 'stable';
            responseTrend: 'improving' | 'degrading' | 'stable';
        };
    };
    getRecommendations(): string[];
    startProfiling(duration?: number): Promise<void>;
    shutdown(): void;
}
export declare const performanceService: PerformanceService;
//# sourceMappingURL=performance.service.d.ts.map