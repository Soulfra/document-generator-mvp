/**
 * Performance Benchmarking Service
 * Automated performance testing and regression detection
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../utils/logger';
import { prometheusMetrics } from '../monitoring/prometheus-metrics.service';
import { redis } from '../../config/redis';

const execAsync = promisify(exec);

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
    responseTimeIncrease: number; // percentage
    throughputDecrease: number; // percentage
    errorRateIncrease: number; // percentage
  };
  testDuration: number;
  warmupDuration: number;
  maxConcurrentUsers: number;
}

const defaultConfig: BenchmarkConfig = {
  baselineThresholds: {
    maxResponseTime: 2000, // 2 seconds
    maxErrorRate: 0.01, // 1%
    minThroughput: 100 // requests per second
  },
  regressionThresholds: {
    responseTimeIncrease: 20, // 20% increase
    throughputDecrease: 15, // 15% decrease
    errorRateIncrease: 50 // 50% increase
  },
  testDuration: 300, // 5 minutes
  warmupDuration: 60, // 1 minute
  maxConcurrentUsers: 50
};

export class BenchmarkService {
  private static instance: BenchmarkService;
  private config: BenchmarkConfig;

  constructor(config: Partial<BenchmarkConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  public static getInstance(config?: Partial<BenchmarkConfig>): BenchmarkService {
    if (!BenchmarkService.instance) {
      BenchmarkService.instance = new BenchmarkService(config);
    }
    return BenchmarkService.instance;
  }

  /**
   * Run comprehensive benchmark suite
   */
  public async runBenchmarkSuite(
    targetUrl: string,
    environment: string = 'development'
  ): Promise<BenchmarkResult[]> {
    const start = Date.now();
    
    try {
      logger.info('Starting benchmark suite', { targetUrl, environment });

      // Ensure target is healthy before testing
      await this.verifyTargetHealth(targetUrl);

      const results: BenchmarkResult[] = [];

      // Run Artillery tests
      try {
        const artilleryResult = await this.runArtilleryBenchmark(targetUrl, environment);
        results.push(artilleryResult);
      } catch (error) {
        logger.error('Artillery benchmark failed', error);
      }

      // Run k6 tests
      try {
        const k6Result = await this.runK6Benchmark(targetUrl, environment);
        results.push(k6Result);
      } catch (error) {
        logger.error('k6 benchmark failed', error);
      }

      // Analyze results for regressions
      await this.analyzeRegressions(results, environment);

      // Store results for historical comparison
      await this.storeResults(results);

      logger.info('Benchmark suite completed', {
        duration: Date.now() - start,
        testsRun: results.length,
        environment
      });

      prometheusMetrics.functionDuration.observe(
        { name: 'benchmark_suite' },
        Date.now() - start
      );

      return results;

    } catch (error) {
      logger.error('Benchmark suite failed', error);
      prometheusMetrics.functionErrors.inc({ name: 'benchmark_suite_error' });
      throw error;
    }
  }

  /**
   * Run Artillery load test
   */
  private async runArtilleryBenchmark(
    targetUrl: string,
    environment: string
  ): Promise<BenchmarkResult> {
    const start = Date.now();
    
    try {
      logger.info('Running Artillery benchmark', { targetUrl, environment });

      const configPath = path.join(process.cwd(), 'tests/load-tests/artillery-config.yml');
      const reportPath = path.join(process.cwd(), 'reports/artillery-report.json');

      // Ensure reports directory exists
      await fs.mkdir(path.dirname(reportPath), { recursive: true });

      const command = `artillery run ${configPath} --output ${reportPath}`;
      const env = {
        ...process.env,
        TARGET_URL: targetUrl,
        TEST_ENVIRONMENT: environment
      };

      const { stdout, stderr } = await execAsync(command, { env });

      // Parse Artillery results
      const reportData = await this.parseArtilleryReport(reportPath);
      
      const result: BenchmarkResult = {
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

      // Check against thresholds
      result.status = this.evaluateResults(result.metrics);

      logger.info('Artillery benchmark completed', {
        duration: result.duration,
        rps: result.metrics.requestsPerSecond,
        avgResponseTime: result.metrics.averageResponseTime,
        status: result.status
      });

      return result;

    } catch (error) {
      logger.error('Artillery benchmark failed', error);
      throw error;
    }
  }

  /**
   * Run k6 load test
   */
  private async runK6Benchmark(
    targetUrl: string,
    environment: string
  ): Promise<BenchmarkResult> {
    const start = Date.now();
    
    try {
      logger.info('Running k6 benchmark', { targetUrl, environment });

      const scriptPath = path.join(process.cwd(), 'tests/load-tests/k6-api-test.js');
      const reportPath = path.join(process.cwd(), 'reports/k6-report.json');

      // Ensure reports directory exists
      await fs.mkdir(path.dirname(reportPath), { recursive: true });

      const command = `k6 run --out json=${reportPath} ${scriptPath}`;
      const env = {
        ...process.env,
        TARGET_URL: targetUrl,
        TEST_ENVIRONMENT: environment
      };

      const { stdout, stderr } = await execAsync(command, { env });

      // Parse k6 results
      const reportData = await this.parseK6Report(reportPath);
      
      const result: BenchmarkResult = {
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

      // Check against thresholds
      result.status = this.evaluateResults(result.metrics);

      logger.info('k6 benchmark completed', {
        duration: result.duration,
        rps: result.metrics.requestsPerSecond,
        avgResponseTime: result.metrics.averageResponseTime,
        status: result.status
      });

      return result;

    } catch (error) {
      logger.error('k6 benchmark failed', error);
      throw error;
    }
  }

  /**
   * Verify target health before testing
   */
  private async verifyTargetHealth(targetUrl: string): Promise<void> {
    try {
      const command = `curl -f -s "${targetUrl}/health"`;
      const { stdout } = await execAsync(command);
      
      const response = JSON.parse(stdout);
      if (!response.success) {
        throw new Error('Target health check failed');
      }
      
      logger.info('Target health verified', { targetUrl });

    } catch (error) {
      logger.error('Target health check failed', { targetUrl, error });
      throw new Error(`Target ${targetUrl} is not healthy: ${error.message}`);
    }
  }

  /**
   * Parse Artillery report
   */
  private async parseArtilleryReport(reportPath: string): Promise<any> {
    try {
      const reportContent = await fs.readFile(reportPath, 'utf-8');
      return JSON.parse(reportContent);
    } catch (error) {
      logger.error('Failed to parse Artillery report', error);
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

  /**
   * Parse k6 report
   */
  private async parseK6Report(reportPath: string): Promise<any> {
    try {
      const reportContent = await fs.readFile(reportPath, 'utf-8');
      const lines = reportContent.trim().split('\n');
      const metrics = { rps: 0, avgResponseTime: 0, p95ResponseTime: 0, p99ResponseTime: 0, errorRate: 0, maxVUs: 0 };
      
      // Parse k6 JSON output
      for (const line of lines) {
        const data = JSON.parse(line);
        if (data.type === 'Metric') {
          const metric = data.data;
          if (metric.name === 'http_reqs') {
            metrics.rps = metric.value;
          } else if (metric.name === 'http_req_duration') {
            if (metric.submetric === 'avg') metrics.avgResponseTime = metric.value;
            if (metric.submetric === 'p(95)') metrics.p95ResponseTime = metric.value;
            if (metric.submetric === 'p(99)') metrics.p99ResponseTime = metric.value;
          } else if (metric.name === 'vus_max') {
            metrics.maxVUs = metric.value;
          }
        }
      }
      
      return metrics;
    } catch (error) {
      logger.error('Failed to parse k6 report', error);
      return { rps: 0, avgResponseTime: 0, p95ResponseTime: 0, p99ResponseTime: 0, errorRate: 0, maxVUs: 0 };
    }
  }

  /**
   * Evaluate results against thresholds
   */
  private evaluateResults(metrics: BenchmarkResult['metrics']): 'pass' | 'fail' | 'warning' {
    const { maxResponseTime, maxErrorRate, minThroughput } = this.config.baselineThresholds;

    if (
      metrics.p95ResponseTime > maxResponseTime ||
      metrics.errorRate > maxErrorRate ||
      metrics.throughput < minThroughput
    ) {
      return 'fail';
    }

    if (
      metrics.p95ResponseTime > maxResponseTime * 0.8 ||
      metrics.errorRate > maxErrorRate * 0.8 ||
      metrics.throughput < minThroughput * 1.2
    ) {
      return 'warning';
    }

    return 'pass';
  }

  /**
   * Analyze for performance regressions
   */
  private async analyzeRegressions(results: BenchmarkResult[], environment: string): Promise<void> {
    try {
      for (const result of results) {
        const historicalData = await this.getHistoricalResults(result.testType, environment, 10);
        
        if (historicalData.length === 0) {
          logger.info('No historical data for regression analysis', {
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
          logger.warn('Performance regressions detected', {
            testType: result.testType,
            regressions,
            environment
          });
          
          prometheusMetrics.performanceAlerts.inc({ type: 'regression' });
        }

        if (improvements.length > 0) {
          logger.info('Performance improvements detected', {
            testType: result.testType,
            improvements,
            environment
          });
        }
      }
    } catch (error) {
      logger.error('Regression analysis failed', error);
    }
  }

  /**
   * Calculate baseline metrics from historical data
   */
  private calculateBaseline(historicalData: BenchmarkResult[]): BenchmarkResult['metrics'] {
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

  /**
   * Detect performance regressions
   */
  private detectRegressions(
    current: BenchmarkResult['metrics'],
    baseline: BenchmarkResult['metrics']
  ): string[] {
    const regressions: string[] = [];
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

  /**
   * Detect performance improvements
   */
  private detectImprovements(
    current: BenchmarkResult['metrics'],
    baseline: BenchmarkResult['metrics']
  ): string[] {
    const improvements: string[] = [];

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

  /**
   * Store benchmark results
   */
  private async storeResults(results: BenchmarkResult[]): Promise<void> {
    try {
      for (const result of results) {
        const key = `benchmark:${result.testType}:${result.environment}:${result.timestamp.getTime()}`;
        await redis.setex(key, 30 * 24 * 60 * 60, JSON.stringify(result)); // 30 days TTL
        
        // Add to sorted set for easy retrieval
        const sortedSetKey = `benchmark_history:${result.testType}:${result.environment}`;
        await redis.zadd(sortedSetKey, result.timestamp.getTime(), result.id);
        
        // Keep only last 100 results
        await redis.zremrangebyrank(sortedSetKey, 0, -101);
      }
      
      logger.info('Benchmark results stored', { count: results.length });
    } catch (error) {
      logger.error('Failed to store benchmark results', error);
    }
  }

  /**
   * Get historical benchmark results
   */
  private async getHistoricalResults(
    testType: string,
    environment: string,
    limit: number = 10
  ): Promise<BenchmarkResult[]> {
    try {
      const sortedSetKey = `benchmark_history:${testType}:${environment}`;
      const resultIds = await redis.zrevrange(sortedSetKey, 0, limit - 1);
      
      const results: BenchmarkResult[] = [];
      for (const id of resultIds) {
        const key = `benchmark:${testType}:${environment}:${id}`;
        const data = await redis.get(key);
        if (data) {
          results.push(JSON.parse(data));
        }
      }
      
      return results;
    } catch (error) {
      logger.error('Failed to get historical results', error);
      return [];
    }
  }

  /**
   * Utility methods
   */
  private average(numbers: number[]): number {
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private percentageIncrease(baseline: number, current: number): number {
    return ((current - baseline) / baseline) * 100;
  }

  private percentageDecrease(baseline: number, current: number): number {
    return ((baseline - current) / baseline) * 100;
  }

  /**
   * Get benchmark summary
   */
  public async getBenchmarkSummary(environment: string): Promise<any> {
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
    } catch (error) {
      logger.error('Failed to get benchmark summary', error);
      return null;
    }
  }
}

// Export singleton instance
export const benchmarkService = BenchmarkService.getInstance();