/**
 * ELK Stack Integration Service
 * Centralized logging with Elasticsearch, Logstash, and Kibana
 */

import winston from 'winston';
import Transport from 'winston-transport';
import axios from 'axios';
import { hostname } from 'os';
import { logger } from '../../utils/logger';

export interface ELKTransportOptions extends Transport.TransportStreamOptions {
  logstashHost?: string;
  logstashPort?: number;
  elasticsearchHost?: string;
  elasticsearchPort?: number;
  indexPrefix?: string;
  messageType?: string;
  includeMetadata?: boolean;
  flushInterval?: number;
  maxBatchSize?: number;
}

/**
 * Custom Winston transport for ELK Stack
 */
export class ELKTransport extends Transport {
  private options: ELKTransportOptions;
  private logBuffer: any[] = [];
  private flushTimer?: NodeJS.Timeout;
  private logstashUrl: string;
  private elasticsearchUrl: string;

  constructor(options: ELKTransportOptions = {}) {
    super(options);
    
    this.options = {
      logstashHost: process.env.LOGSTASH_HOST || 'localhost',
      logstashPort: parseInt(process.env.LOGSTASH_PORT || '5000'),
      elasticsearchHost: process.env.ELASTICSEARCH_HOST || 'localhost',
      elasticsearchPort: parseInt(process.env.ELASTICSEARCH_PORT || '9200'),
      indexPrefix: 'finishthisidea',
      messageType: 'application',
      includeMetadata: true,
      flushInterval: 5000, // 5 seconds
      maxBatchSize: 100,
      ...options
    };

    this.logstashUrl = `http://${this.options.logstashHost}:${this.options.logstashPort}`;
    this.elasticsearchUrl = `http://${this.options.elasticsearchHost}:${this.options.elasticsearchPort}`;

    // Start flush timer
    this.startFlushTimer();
  }

  /**
   * Log method called by Winston
   */
  log(info: any, callback: Function): void {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // Format log entry
    const logEntry = this.formatLogEntry(info);
    
    // Add to buffer
    this.logBuffer.push(logEntry);

    // Flush if buffer is full
    if (this.logBuffer.length >= this.options.maxBatchSize!) {
      this.flush();
    }

    callback();
  }

  /**
   * Format log entry for ELK
   */
  private formatLogEntry(info: any): any {
    const entry: any = {
      '@timestamp': new Date().toISOString(),
      level: info.level,
      message: info.message,
      type: this.options.messageType,
      hostname: hostname(),
      application: 'finishthisidea',
      environment: process.env.NODE_ENV || 'development'
    };

    // Add metadata if enabled
    if (this.options.includeMetadata) {
      const { level, message, timestamp, ...metadata } = info;
      
      // Add all metadata fields
      Object.assign(entry, metadata);

      // Extract specific fields
      if (metadata.error) {
        entry.error = {
          type: metadata.error.name || 'Error',
          message: metadata.error.message,
          stack: metadata.error.stack
        };
      }

      if (metadata.req) {
        entry.request = {
          method: metadata.req.method,
          url: metadata.req.url,
          ip: metadata.req.ip,
          userAgent: metadata.req.get('user-agent')
        };
      }

      if (metadata.userId) {
        entry.userId = metadata.userId;
      }

      if (metadata.duration) {
        entry.duration = metadata.duration;
      }
    }

    return entry;
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.logBuffer.length > 0) {
        this.flush();
      }
    }, this.options.flushInterval!);
  }

  /**
   * Flush log buffer to Logstash
   */
  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Send to Logstash HTTP input
      await axios.post(
        `${this.logstashUrl}/`,
        logsToSend,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
    } catch (error) {
      // Fallback: try direct Elasticsearch bulk insert
      try {
        await this.bulkInsertToElasticsearch(logsToSend);
      } catch (esError) {
        // If both fail, log locally and re-add to buffer
        console.error('Failed to send logs to ELK:', error);
        this.logBuffer.unshift(...logsToSend.slice(0, 10)); // Keep only 10 to prevent memory issues
      }
    }
  }

  /**
   * Bulk insert directly to Elasticsearch
   */
  private async bulkInsertToElasticsearch(logs: any[]): Promise<void> {
    const bulkBody = logs.flatMap(log => [
      {
        index: {
          _index: `${this.options.indexPrefix}-${log.type}-${new Date().toISOString().split('T')[0]}`
        }
      },
      log
    ]);

    await axios.post(
      `${this.elasticsearchUrl}/_bulk`,
      bulkBody.map(item => JSON.stringify(item)).join('\n') + '\n',
      {
        headers: {
          'Content-Type': 'application/x-ndjson'
        },
        timeout: 10000
      }
    );
  }

  /**
   * Close transport
   */
  close(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Final flush
    this.flush();
  }
}

/**
 * Create ELK logger instance
 */
export function createELKLogger(options?: ELKTransportOptions): winston.Logger {
  const elkTransport = new ELKTransport(options);

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      elkTransport,
      // Also log to console in development
      ...(process.env.NODE_ENV !== 'production' ? [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ] : [])
    ]
  });
}

/**
 * Elasticsearch query builder for log analysis
 */
export class LogAnalyzer {
  private elasticsearchUrl: string;

  constructor() {
    this.elasticsearchUrl = `http://${process.env.ELASTICSEARCH_HOST || 'localhost'}:${process.env.ELASTICSEARCH_PORT || '9200'}`;
  }

  /**
   * Search logs
   */
  async searchLogs(query: any, index?: string): Promise<any> {
    const targetIndex = index || 'finishthisidea-*';
    
    const response = await axios.post(
      `${this.elasticsearchUrl}/${targetIndex}/_search`,
      query,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  }

  /**
   * Get error trends
   */
  async getErrorTrends(timeRange: string = '24h'): Promise<any> {
    const query = {
      size: 0,
      query: {
        bool: {
          filter: [
            { term: { level: 'error' } },
            { range: { '@timestamp': { gte: `now-${timeRange}` } } }
          ]
        }
      },
      aggs: {
        errors_over_time: {
          date_histogram: {
            field: '@timestamp',
            calendar_interval: '1h'
          },
          aggs: {
            by_error_type: {
              terms: {
                field: 'error.type',
                size: 10
              }
            }
          }
        }
      }
    };

    return this.searchLogs(query, 'finishthisidea-errors-*');
  }

  /**
   * Get slow requests
   */
  async getSlowRequests(threshold: number = 5000): Promise<any> {
    const query = {
      size: 100,
      query: {
        bool: {
          filter: [
            { range: { duration: { gte: threshold } } },
            { range: { '@timestamp': { gte: 'now-1h' } } }
          ]
        }
      },
      sort: [
        { duration: { order: 'desc' } }
      ]
    };

    return this.searchLogs(query);
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId: string, days: number = 7): Promise<any> {
    const query = {
      size: 1000,
      query: {
        bool: {
          filter: [
            { term: { userId } },
            { range: { '@timestamp': { gte: `now-${days}d` } } }
          ]
        }
      },
      sort: [
        { '@timestamp': { order: 'desc' } }
      ]
    };

    return this.searchLogs(query);
  }

  /**
   * Get security events
   */
  async getSecurityEvents(hours: number = 24): Promise<any> {
    const query = {
      size: 100,
      query: {
        bool: {
          filter: [
            { term: { 'tags.keyword': 'security_event' } },
            { range: { '@timestamp': { gte: `now-${hours}h` } } }
          ]
        }
      },
      sort: [
        { '@timestamp': { order: 'desc' } }
      ]
    };

    return this.searchLogs(query, 'finishthisidea-security-*');
  }
}

// Export singleton instances
export const elkLogger = createELKLogger();
export const logAnalyzer = new LogAnalyzer();