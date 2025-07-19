export interface BenchmarkResult {
    id: string;
    timestamp: Date;
    testType: 'artillery' | 'k6' | 'custom';
    environment: string;
    duration: number;
    metrics: {
        requestsPerSecond: number;
        averageResponseTime: number;
        p95ResponseTime: number;
        p99ResponseTime: number;
        errorRate: number;
        throughput: number;
        concurrentUsers: number;
    };
    status: 'pass' | 'fail' | 'warning';
    regressions: string[];
    improvements: string[];
}
export interface BenchmarkConfig {
    baselineThresholds: {
        maxResponseTime: number;
        maxErrorRate: number;
        minThroughput: number;
    };
    regressionThresholds: {
        responseTimeIncrease: number;
        throughputDecrease: number;
        errorRateIncrease: number;
    };
    testDuration: number;
    warmupDuration: number;
    maxConcurrentUsers: number;
}
export declare class BenchmarkService {
    private static instance;
    private config;
    constructor(config?: Partial<BenchmarkConfig>);
    static getInstance(config?: Partial<BenchmarkConfig>): BenchmarkService;
    runBenchmarkSuite(targetUrl: string, environment?: string): Promise<BenchmarkResult[]>;
    private runArtilleryBenchmark;
    private runK6Benchmark;
    private verifyTargetHealth;
    private parseArtilleryReport;
    private parseK6Report;
    private evaluateResults;
    private analyzeRegressions;
    private calculateBaseline;
    private detectRegressions;
    private detectImprovements;
    private storeResults;
    private getHistoricalResults;
    private average;
    private percentageIncrease;
    private percentageDecrease;
    getBenchmarkSummary(environment: string): Promise<any>;
}
export declare const benchmarkService: BenchmarkService;
//# sourceMappingURL=benchmark.service.d.ts.map