export interface MetricData {
    name: string;
    value: number;
    timestamp: Date;
    labels?: Record<string, string>;
}
export interface SystemMetrics {
    requests: {
        total: number;
        success: number;
        errors: number;
        rate: number;
    };
    database: {
        connections: number;
        queries: number;
        avgQueryTime: number;
    };
    cache: {
        hits: number;
        misses: number;
        hitRate: number;
    };
    memory: {
        used: number;
        total: number;
        usage: number;
    };
}
declare class MetricsService {
    private metrics;
    recordMetric(name: string, value: number, labels?: Record<string, string>): Promise<void>;
    incrementCounter(name: string, labels?: Record<string, string>): Promise<void>;
    recordTiming(name: string, duration: number, labels?: Record<string, string>): Promise<void>;
    getSystemMetrics(): Promise<SystemMetrics>;
    getMetricHistory(name: string, hours?: number): Promise<MetricData[]>;
    getCurrentValue(name: string): Promise<number>;
    private getMetricSum;
    private getAverageMetric;
    private getRequestRate;
    private getMemoryUsage;
    private getDefaultMetrics;
    cleanupOldMetrics(): Promise<void>;
    exportPrometheusMetrics(): Promise<string>;
}
export declare const metricsService: MetricsService;
export declare const metricsMiddleware: (req: any, res: any, next: any) => void;
export default metricsService;
//# sourceMappingURL=metrics.service.d.ts.map