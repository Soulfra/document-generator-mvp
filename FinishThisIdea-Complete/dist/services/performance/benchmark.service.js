"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.benchmarkService = exports.BenchmarkService = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../../utils/logger");
const prometheus_metrics_service_1 = require("../monitoring/prometheus-metrics.service");
const redis_1 = require("../../config/redis");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const defaultConfig = {
    baselineThresholds: {
        maxResponseTime: 2000,
        maxErrorRate: 0.01,
        minThroughput: 100
    },
    regressionThresholds: {
        responseTimeIncrease: 20,
        throughputDecrease: 15,
        errorRateIncrease: 50
    },
    testDuration: 300,
    warmupDuration: 60,
    maxConcurrentUsers: 50
};
class BenchmarkService {
    static instance;
    config;
    constructor(config = {}) {
        this.config = { ...defaultConfig, ...config };
    }
    static getInstance(config) {
        if (!BenchmarkService.instance) {
            BenchmarkService.instance = new BenchmarkService(config);
        }
        return BenchmarkService.instance;
    }
    async runBenchmarkSuite(targetUrl, environment = 'development') {
        const start = Date.now();
        try {
            logger_1.logger.info('Starting benchmark suite', { targetUrl, environment });
            await this.verifyTargetHealth(targetUrl);
            const results = [];
            try {
                const artilleryResult = await this.runArtilleryBenchmark(targetUrl, environment);
                results.push(artilleryResult);
            }
            catch (error) {
                logger_1.logger.error('Artillery benchmark failed', error);
            }
            try {
                const k6Result = await this.runK6Benchmark(targetUrl, environment);
                results.push(k6Result);
            }
            catch (error) {
                logger_1.logger.error('k6 benchmark failed', error);
            }
            await this.analyzeRegressions(results, environment);
            await this.storeResults(results);
            logger_1.logger.info('Benchmark suite completed', {
                duration: Date.now() - start,
                testsRun: results.length,
                environment
            });
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'benchmark_suite' }, Date.now() - start);
            return results;
        }
        catch (error) {
            logger_1.logger.error('Benchmark suite failed', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'benchmark_suite_error' });
            throw error;
        }
    }
    async runArtilleryBenchmark(targetUrl, environment) {
        const start = Date.now();
        try {
            logger_1.logger.info('Running Artillery benchmark', { targetUrl, environment });
            const configPath = path_1.default.join(process.cwd(), 'tests/load-tests/artillery-config.yml');
            const reportPath = path_1.default.join(process.cwd(), 'reports/artillery-report.json');
            await promises_1.default.mkdir(path_1.default.dirname(reportPath), { recursive: true });
            const command = `artillery run ${configPath} --output ${reportPath}`;
            const env = {
                ...process.env,
                TARGET_URL: targetUrl,
                TEST_ENVIRONMENT: environment
            };
            const { stdout, stderr } = await execAsync(command, { env });
            const reportData = await this.parseArtilleryReport(reportPath);
            const result = {
                id: `artillery-${Date.now()}`,
                timestamp: new Date(),
                testType: 'artillery',
                environment,
                duration: Date.now() - start,
                metrics: {
                    requestsPerSecond: reportData.aggregate.rps?.mean || 0,
                    averageResponseTime: reportData.aggregate.latency?.mean || 0,
                    p95ResponseTime: reportData.aggregate.latency?.p95 || 0,
                    p99ResponseTime: reportData.aggregate.latency?.p99 || 0,
                    errorRate: (reportData.aggregate.errors || 0) / (reportData.aggregate.requests || 1),
                    throughput: reportData.aggregate.rps?.mean || 0,
                    concurrentUsers: reportData.aggregate.scenarios?.completed || 0
                },
                status: 'pass',
                regressions: [],
                improvements: []
            };
            result.status = this.evaluateResults(result.metrics);
            logger_1.logger.info('Artillery benchmark completed', {
                duration: result.duration,
                rps: result.metrics.requestsPerSecond,
                avgResponseTime: result.metrics.averageResponseTime,
                status: result.status
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Artillery benchmark failed', error);
            throw error;
        }
    }
    async runK6Benchmark(targetUrl, environment) {
        const start = Date.now();
        try {
            logger_1.logger.info('Running k6 benchmark', { targetUrl, environment });
            const scriptPath = path_1.default.join(process.cwd(), 'tests/load-tests/k6-api-test.js');
            const reportPath = path_1.default.join(process.cwd(), 'reports/k6-report.json');
            await promises_1.default.mkdir(path_1.default.dirname(reportPath), { recursive: true });
            const command = `k6 run --out json=${reportPath} ${scriptPath}`;
            const env = {
                ...process.env,
                TARGET_URL: targetUrl,
                TEST_ENVIRONMENT: environment
            };
            const { stdout, stderr } = await execAsync(command, { env });
            const reportData = await this.parseK6Report(reportPath);
            const result = {
                id: `k6-${Date.now()}`,
                timestamp: new Date(),
                testType: 'k6',
                environment,
                duration: Date.now() - start,
                metrics: {
                    requestsPerSecond: reportData.rps || 0,
                    averageResponseTime: reportData.avgResponseTime || 0,
                    p95ResponseTime: reportData.p95ResponseTime || 0,
                    p99ResponseTime: reportData.p99ResponseTime || 0,
                    errorRate: reportData.errorRate || 0,
                    throughput: reportData.rps || 0,
                    concurrentUsers: reportData.maxVUs || 0
                },
                status: 'pass',
                regressions: [],
                improvements: []
            };
            result.status = this.evaluateResults(result.metrics);
            logger_1.logger.info('k6 benchmark completed', {
                duration: result.duration,
                rps: result.metrics.requestsPerSecond,
                avgResponseTime: result.metrics.averageResponseTime,
                status: result.status
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('k6 benchmark failed', error);
            throw error;
        }
    }
    async verifyTargetHealth(targetUrl) {
        try {
            const command = `curl -f -s "${targetUrl}/health"`;
            const { stdout } = await execAsync(command);
            const response = JSON.parse(stdout);
            if (!response.success) {
                throw new Error('Target health check failed');
            }
            logger_1.logger.info('Target health verified', { targetUrl });
        }
        catch (error) {
            logger_1.logger.error('Target health check failed', { targetUrl, error });
            throw new Error(`Target ${targetUrl} is not healthy: ${error.message}`);
        }
    }
    async parseArtilleryReport(reportPath) {
        try {
            const reportContent = await promises_1.default.readFile(reportPath, 'utf-8');
            return JSON.parse(reportContent);
        }
        catch (error) {
            logger_1.logger.error('Failed to parse Artillery report', error);
            return {
                aggregate: {
                    rps: { mean: 0 },
                    latency: { mean: 0, p95: 0, p99: 0 },
                    requests: 0,
                    errors: 0,
                    scenarios: { completed: 0 }
                }
            };
        }
    }
    async parseK6Report(reportPath) {
        try {
            const reportContent = await promises_1.default.readFile(reportPath, 'utf-8');
            const lines = reportContent.trim().split('\n');
            const metrics = { rps: 0, avgResponseTime: 0, p95ResponseTime: 0, p99ResponseTime: 0, errorRate: 0, maxVUs: 0 };
            for (const line of lines) {
                const data = JSON.parse(line);
                if (data.type === 'Metric') {
                    const metric = data.data;
                    if (metric.name === 'http_reqs') {
                        metrics.rps = metric.value;
                    }
                    else if (metric.name === 'http_req_duration') {
                        if (metric.submetric === 'avg')
                            metrics.avgResponseTime = metric.value;
                        if (metric.submetric === 'p(95)')
                            metrics.p95ResponseTime = metric.value;
                        if (metric.submetric === 'p(99)')
                            metrics.p99ResponseTime = metric.value;
                    }
                    else if (metric.name === 'vus_max') {
                        metrics.maxVUs = metric.value;
                    }
                }
            }
            return metrics;
        }
        catch (error) {
            logger_1.logger.error('Failed to parse k6 report', error);
            return { rps: 0, avgResponseTime: 0, p95ResponseTime: 0, p99ResponseTime: 0, errorRate: 0, maxVUs: 0 };
        }
    }
    evaluateResults(metrics) {
        const { maxResponseTime, maxErrorRate, minThroughput } = this.config.baselineThresholds;
        if (metrics.p95ResponseTime > maxResponseTime ||
            metrics.errorRate > maxErrorRate ||
            metrics.throughput < minThroughput) {
            return 'fail';
        }
        if (metrics.p95ResponseTime > maxResponseTime * 0.8 ||
            metrics.errorRate > maxErrorRate * 0.8 ||
            metrics.throughput < minThroughput * 1.2) {
            return 'warning';
        }
        return 'pass';
    }
    async analyzeRegressions(results, environment) {
        try {
            for (const result of results) {
                const historicalData = await this.getHistoricalResults(result.testType, environment, 10);
                if (historicalData.length === 0) {
                    logger_1.logger.info('No historical data for regression analysis', {
                        testType: result.testType,
                        environment
                    });
                    continue;
                }
                const baseline = this.calculateBaseline(historicalData);
                const regressions = this.detectRegressions(result.metrics, baseline);
                const improvements = this.detectImprovements(result.metrics, baseline);
                result.regressions = regressions;
                result.improvements = improvements;
                if (regressions.length > 0) {
                    logger_1.logger.warn('Performance regressions detected', {
                        testType: result.testType,
                        regressions,
                        environment
                    });
                    prometheus_metrics_service_1.prometheusMetrics.performanceAlerts.inc({ type: 'regression' });
                }
                if (improvements.length > 0) {
                    logger_1.logger.info('Performance improvements detected', {
                        testType: result.testType,
                        improvements,
                        environment
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Regression analysis failed', error);
        }
    }
    calculateBaseline(historicalData) {
        const metrics = historicalData.map(r => r.metrics);
        return {
            requestsPerSecond: this.average(metrics.map(m => m.requestsPerSecond)),
            averageResponseTime: this.average(metrics.map(m => m.averageResponseTime)),
            p95ResponseTime: this.average(metrics.map(m => m.p95ResponseTime)),
            p99ResponseTime: this.average(metrics.map(m => m.p99ResponseTime)),
            errorRate: this.average(metrics.map(m => m.errorRate)),
            throughput: this.average(metrics.map(m => m.throughput)),
            concurrentUsers: this.average(metrics.map(m => m.concurrentUsers))
        };
    }
    detectRegressions(current, baseline) {
        const regressions = [];
        const thresholds = this.config.regressionThresholds;
        if (this.percentageIncrease(baseline.averageResponseTime, current.averageResponseTime) > thresholds.responseTimeIncrease) {
            regressions.push(`Average response time increased by ${this.percentageIncrease(baseline.averageResponseTime, current.averageResponseTime).toFixed(1)}%`);
        }
        if (this.percentageIncrease(baseline.p95ResponseTime, current.p95ResponseTime) > thresholds.responseTimeIncrease) {
            regressions.push(`P95 response time increased by ${this.percentageIncrease(baseline.p95ResponseTime, current.p95ResponseTime).toFixed(1)}%`);
        }
        if (this.percentageDecrease(baseline.throughput, current.throughput) > thresholds.throughputDecrease) {
            regressions.push(`Throughput decreased by ${this.percentageDecrease(baseline.throughput, current.throughput).toFixed(1)}%`);
        }
        if (this.percentageIncrease(baseline.errorRate, current.errorRate) > thresholds.errorRateIncrease) {
            regressions.push(`Error rate increased by ${this.percentageIncrease(baseline.errorRate, current.errorRate).toFixed(1)}%`);
        }
        return regressions;
    }
    detectImprovements(current, baseline) {
        const improvements = [];
        if (this.percentageDecrease(baseline.averageResponseTime, current.averageResponseTime) > 10) {
            improvements.push(`Average response time improved by ${this.percentageDecrease(baseline.averageResponseTime, current.averageResponseTime).toFixed(1)}%`);
        }
        if (this.percentageIncrease(baseline.throughput, current.throughput) > 10) {
            improvements.push(`Throughput improved by ${this.percentageIncrease(baseline.throughput, current.throughput).toFixed(1)}%`);
        }
        if (this.percentageDecrease(baseline.errorRate, current.errorRate) > 20) {
            improvements.push(`Error rate improved by ${this.percentageDecrease(baseline.errorRate, current.errorRate).toFixed(1)}%`);
        }
        return improvements;
    }
    async storeResults(results) {
        try {
            for (const result of results) {
                const key = `benchmark:${result.testType}:${result.environment}:${result.timestamp.getTime()}`;
                await redis_1.redis.setex(key, 30 * 24 * 60 * 60, JSON.stringify(result));
                const sortedSetKey = `benchmark_history:${result.testType}:${result.environment}`;
                await redis_1.redis.zadd(sortedSetKey, result.timestamp.getTime(), result.id);
                await redis_1.redis.zremrangebyrank(sortedSetKey, 0, -101);
            }
            logger_1.logger.info('Benchmark results stored', { count: results.length });
        }
        catch (error) {
            logger_1.logger.error('Failed to store benchmark results', error);
        }
    }
    async getHistoricalResults(testType, environment, limit = 10) {
        try {
            const sortedSetKey = `benchmark_history:${testType}:${environment}`;
            const resultIds = await redis_1.redis.zrevrange(sortedSetKey, 0, limit - 1);
            const results = [];
            for (const id of resultIds) {
                const key = `benchmark:${testType}:${environment}:${id}`;
                const data = await redis_1.redis.get(key);
                if (data) {
                    results.push(JSON.parse(data));
                }
            }
            return results;
        }
        catch (error) {
            logger_1.logger.error('Failed to get historical results', error);
            return [];
        }
    }
    average(numbers) {
        return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    }
    percentageIncrease(baseline, current) {
        return ((current - baseline) / baseline) * 100;
    }
    percentageDecrease(baseline, current) {
        return ((baseline - current) / baseline) * 100;
    }
    async getBenchmarkSummary(environment) {
        try {
            const artilleryResults = await this.getHistoricalResults('artillery', environment, 5);
            const k6Results = await this.getHistoricalResults('k6', environment, 5);
            return {
                artillery: {
                    recent: artilleryResults.slice(0, 5),
                    averageMetrics: artilleryResults.length > 0 ? this.calculateBaseline(artilleryResults) : null
                },
                k6: {
                    recent: k6Results.slice(0, 5),
                    averageMetrics: k6Results.length > 0 ? this.calculateBaseline(k6Results) : null
                },
                lastUpdated: new Date()
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get benchmark summary', error);
            return null;
        }
    }
}
exports.BenchmarkService = BenchmarkService;
exports.benchmarkService = BenchmarkService.getInstance();
//# sourceMappingURL=benchmark.service.js.map