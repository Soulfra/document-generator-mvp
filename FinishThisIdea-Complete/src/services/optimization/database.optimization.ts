import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { dbCache } from '../cache/cache.service';
import { performanceService } from '../performance/performance.service';
import { prometheusMetrics } from '../monitoring/prometheus-metrics.service';

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

export class DatabaseOptimizationService {
  private prisma: PrismaClient;
  private slowQueryThreshold = 1000; // 1 second
  private slowQueries: Array<{ query: string; duration: number; timestamp: Date }> = [];
  private queryStats = new Map<string, { count: number; totalTime: number; avgTime: number }>();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.setupQueryMonitoring();
  }

  private setupQueryMonitoring(): void {
    // Note: This is a simplified example. In practice, you'd use Prisma middleware
    // or database-specific monitoring tools for comprehensive query tracking.
    
    // Monitor Prisma events if available
    this.prisma.$on('query' as never, (e: any) => {
      const duration = e.duration;
      const query = e.query;
      
      prometheusMetrics.databaseQueryDuration.observe({ query: this.sanitizeQuery(query) }, duration);
      
      if (duration > this.slowQueryThreshold) {
        this.slowQueries.push({
          query: this.sanitizeQuery(query),
          duration,
          timestamp: new Date()
        });
        
        // Keep only last 100 slow queries
        if (this.slowQueries.length > 100) {
          this.slowQueries = this.slowQueries.slice(-100);
        }
        
        logger.warn('Slow query detected', {
          query: this.sanitizeQuery(query),
          duration: `${duration}ms`,
          threshold: `${this.slowQueryThreshold}ms`
        });
      }
      
      // Update query statistics
      const queryKey = this.sanitizeQuery(query);
      const stats = this.queryStats.get(queryKey) || { count: 0, totalTime: 0, avgTime: 0 };
      stats.count++;
      stats.totalTime += duration;
      stats.avgTime = stats.totalTime / stats.count;
      this.queryStats.set(queryKey, stats);
    });
  }

  private sanitizeQuery(query: string): string {
    // Remove specific values and just keep the query structure
    return query
      .replace(/\$\d+/g, '$?') // Replace parameters
      .replace(/\d+/g, '?')    // Replace numbers
      .replace(/'[^']*'/g, '?') // Replace strings
      .substring(0, 100);       // Truncate long queries
  }

  // Optimized findMany with caching and pagination
  async optimizedFindMany<T>(
    model: string,
    args: any = {},
    options: QueryOptimizationOptions = {}
  ): Promise<T[]> {
    const cacheKey = `findMany:${model}:${JSON.stringify(args)}`;
    const config = {
      cache: options.cache ?? true,
      cacheTtl: options.cacheTtl ?? 300,
      maxRetries: options.maxRetries ?? 3,
      timeout: options.timeout ?? 10000,
      batchSize: options.batchSize ?? 1000,
      ...options
    };

    // Try cache first
    if (config.cache) {
      const cached = await dbCache.get<T[]>(cacheKey);
      if (cached) {
        prometheusMetrics.cacheHits.inc({ cache: 'database' });
        return cached;
      }
      prometheusMetrics.cacheMisses.inc({ cache: 'database' });
    }

    return performanceService.measureAsync(`db:findMany:${model}`, async () => {
      try {
        // Add pagination if not specified and result might be large
        if (!args.take && !args.skip) {
          args.take = config.batchSize;
        }

        // Execute query with timeout
        const result = await this.executeWithTimeout(
          () => (this.prisma as any)[model].findMany(args),
          config.timeout
        );

        // Cache successful results
        if (config.cache && result) {
          await dbCache.set(cacheKey, result, {
            ttl: config.cacheTtl,
            tags: [`model:${model}`]
          });
        }

        return result;
      } catch (error) {
        logger.error('Optimized findMany failed', { model, args, error });
        prometheusMetrics.databaseErrors.inc({ operation: 'findMany', model });
        throw error;
      }
    });
  }

  // Optimized findUnique with caching
  async optimizedFindUnique<T>(
    model: string,
    args: any,
    options: QueryOptimizationOptions = {}
  ): Promise<T | null> {
    const cacheKey = `findUnique:${model}:${JSON.stringify(args)}`;
    const config = {
      cache: options.cache ?? true,
      cacheTtl: options.cacheTtl ?? 600, // Longer cache for unique records
      ...options
    };

    if (config.cache) {
      const cached = await dbCache.get<T>(cacheKey);
      if (cached) {
        prometheusMetrics.cacheHits.inc({ cache: 'database' });
        return cached;
      }
      prometheusMetrics.cacheMisses.inc({ cache: 'database' });
    }

    return performanceService.measureAsync(`db:findUnique:${model}`, async () => {
      try {
        const result = await this.executeWithTimeout(
          () => (this.prisma as any)[model].findUnique(args),
          config.timeout || 5000
        );

        if (config.cache && result) {
          await dbCache.set(cacheKey, result, {
            ttl: config.cacheTtl,
            tags: [`model:${model}`, `record:${model}:${JSON.stringify(args.where)}`]
          });
        }

        return result;
      } catch (error) {
        logger.error('Optimized findUnique failed', { model, args, error });
        prometheusMetrics.databaseErrors.inc({ operation: 'findUnique', model });
        throw error;
      }
    });
  }

  // Batch operations for better performance
  async batchCreate<T>(
    model: string,
    data: any[],
    options: QueryOptimizationOptions = {}
  ): Promise<T[]> {
    const config = {
      batchSize: options.batchSize ?? 100,
      maxRetries: options.maxRetries ?? 3,
      ...options
    };

    return performanceService.measureAsync(`db:batchCreate:${model}`, async () => {
      const results: T[] = [];
      
      try {
        // Process in batches to avoid memory issues
        for (let i = 0; i < data.length; i += config.batchSize) {
          const batch = data.slice(i, i + config.batchSize);
          
          const batchResult = await this.executeWithRetry(
            () => (this.prisma as any)[model].createMany({
              data: batch,
              skipDuplicates: true
            }),
            config.maxRetries
          );

          results.push(...batchResult);

          // Invalidate cache for this model
          await dbCache.invalidateByTag(`model:${model}`);
        }

        return results;
      } catch (error) {
        logger.error('Batch create failed', { model, batchCount: data.length, error });
        prometheusMetrics.databaseErrors.inc({ operation: 'batchCreate', model });
        throw error;
      }
    });
  }

  // Optimized aggregation with caching
  async optimizedAggregate(
    model: string,
    args: any,
    options: QueryOptimizationOptions = {}
  ): Promise<any> {
    const cacheKey = `aggregate:${model}:${JSON.stringify(args)}`;
    const config = {
      cache: options.cache ?? true,
      cacheTtl: options.cacheTtl ?? 180, // 3 minutes for aggregations
      ...options
    };

    if (config.cache) {
      const cached = await dbCache.get(cacheKey);
      if (cached) {
        prometheusMetrics.cacheHits.inc({ cache: 'database' });
        return cached;
      }
      prometheusMetrics.cacheMisses.inc({ cache: 'database' });
    }

    return performanceService.measureAsync(`db:aggregate:${model}`, async () => {
      try {
        const result = await this.executeWithTimeout(
          () => (this.prisma as any)[model].aggregate(args),
          config.timeout || 15000 // Longer timeout for aggregations
        );

        if (config.cache && result) {
          await dbCache.set(cacheKey, result, {
            ttl: config.cacheTtl,
            tags: [`model:${model}`, 'aggregation']
          });
        }

        return result;
      } catch (error) {
        logger.error('Optimized aggregate failed', { model, args, error });
        prometheusMetrics.databaseErrors.inc({ operation: 'aggregate', model });
        throw error;
      }
    });
  }

  // Transaction with retry logic
  async optimizedTransaction<T>(
    fn: (tx: any) => Promise<T>,
    options: QueryOptimizationOptions = {}
  ): Promise<T> {
    const config = {
      maxRetries: options.maxRetries ?? 3,
      timeout: options.timeout ?? 30000,
      ...options
    };

    return performanceService.measureAsync('db:transaction', async () => {
      return this.executeWithRetry(
        () => this.prisma.$transaction(fn, {
          timeout: config.timeout,
          isolationLevel: 'ReadCommitted'
        }),
        config.maxRetries
      );
    });
  }

  // Execute query with timeout
  private async executeWithTimeout<T>(
    query: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      query(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Query timeout after ${timeout}ms`)), timeout);
      })
    ]);
  }

  // Execute with retry logic
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
          logger.warn(`Database operation failed, retrying in ${delay}ms`, {
            attempt,
            maxRetries,
            error: error instanceof Error ? error.message : error
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  private isNonRetryableError(error: any): boolean {
    // Don't retry validation errors, constraint violations, etc.
    const nonRetryableErrors = [
      'P2002', // Unique constraint violation
      'P2003', // Foreign key constraint violation
      'P2025', // Record not found
      'P2016', // Query interpretation error
    ];
    
    return nonRetryableErrors.some(code => 
      error.code === code || error.message?.includes(code)
    );
  }

  // Invalidate cache for specific model
  async invalidateModelCache(model: string): Promise<void> {
    await dbCache.invalidateByTag(`model:${model}`);
    logger.info('Model cache invalidated', { model });
  }

  // Get database performance metrics
  getPerformanceMetrics(): DatabasePerformanceMetrics {
    const totalQueries = Array.from(this.queryStats.values()).reduce((sum, stats) => sum + stats.count, 0);
    const totalTime = Array.from(this.queryStats.values()).reduce((sum, stats) => sum + stats.totalTime, 0);
    const avgQueryTime = totalQueries > 0 ? totalTime / totalQueries : 0;

    return {
      queryCount: totalQueries,
      avgQueryTime: Math.round(avgQueryTime * 100) / 100,
      slowQueries: this.slowQueries.slice(-10), // Last 10 slow queries
      cacheHitRate: 0, // Would be calculated from cache service stats
      connectionPoolStats: {
        active: 0, // Would be retrieved from connection pool
        idle: 0,
        total: 0
      }
    };
  }

  // Optimize specific query patterns
  async optimizeQueryPlan(model: string, query: any): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Check for missing indexes
    if (query.where && !query.orderBy) {
      recommendations.push('Consider adding an index for the WHERE clause columns');
    }
    
    // Check for N+1 queries
    if (query.include && !query.select) {
      recommendations.push('Consider using select to limit the fields returned');
    }
    
    // Check for large result sets without pagination
    if (!query.take && !query.skip) {
      recommendations.push('Consider adding pagination (take/skip) for large result sets');
    }
    
    // Check for complex joins
    if (query.include && Object.keys(query.include).length > 3) {
      recommendations.push('Complex joins detected - consider breaking into multiple queries');
    }
    
    return recommendations;
  }

  // Database health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: DatabasePerformanceMetrics;
    recommendations: string[];
  }> {
    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;
      
      const metrics = this.getPerformanceMetrics();
      const recommendations: string[] = [];
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (responseTime > 100) {
        status = 'degraded';
        recommendations.push('Database response time is elevated');
      }
      
      if (metrics.slowQueries.length > 5) {
        status = 'degraded';
        recommendations.push('Multiple slow queries detected');
      }
      
      if (responseTime > 1000) {
        status = 'unhealthy';
        recommendations.push('Database response time is critically high');
      }
      
      return { status, metrics, recommendations };
    } catch (error) {
      logger.error('Database health check failed', { error });
      return {
        status: 'unhealthy',
        metrics: this.getPerformanceMetrics(),
        recommendations: ['Database connection failed']
      };
    }
  }
}

// Export singleton instance
export const databaseOptimization = new DatabaseOptimizationService(
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
  })
);