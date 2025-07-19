/**
 * SENTRY CONFIGURATION
 * 
 * Centralized Sentry configuration for error tracking, performance monitoring,
 * and observability across the FinishThisIdea platform
 */

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { logger } from '../utils/logger';
import { env } from '../utils/env-validation';

// Sentry configuration interface
interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  sampleRate: number;
  tracesSampleRate: number;
  profilesSampleRate: number;
  integrations: Sentry.Integration[];
  beforeSend?: (event: Sentry.Event) => Sentry.Event | null;
  beforeSendTransaction?: (event: Sentry.Transaction) => Sentry.Transaction | null;
}

// Environment-specific configuration
const getSentryConfig = (): SentryConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || `finishthisidea@${process.env.npm_package_version || '1.0.0'}`,
    
    // Sample rates - more aggressive in production
    sampleRate: isProduction ? 1.0 : 0.5,
    tracesSampleRate: isProduction ? 0.2 : 0.1,
    profilesSampleRate: isProduction ? 0.1 : 0.05,
    
    integrations: [
      // Automatic instrumentation
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: undefined }),
      new Sentry.Integrations.Postgres(),
      new Sentry.Integrations.Redis(),
      new ProfilingIntegration(),
      
      // Custom integrations
      new Sentry.Integrations.OnUncaughtException({
        exitEvenIfOtherHandlersAreRegistered: false,
      }),
      new Sentry.Integrations.OnUnhandledRejection({
        mode: 'warn',
      }),
    ],
    
    // Event filtering and enhancement
    beforeSend: (event) => {
      // Filter out non-critical errors in development
      if (isDevelopment && event.level === 'warning') {
        return null;
      }
      
      // Add custom context
      if (event.extra) {
        event.extra.timestamp = new Date().toISOString();
        event.extra.nodeVersion = process.version;
        event.extra.platform = process.platform;
      }
      
      return event;
    },
    
    beforeSendTransaction: (transaction) => {
      // Filter out health check transactions
      if (transaction.name?.includes('/health')) {
        return null;
      }
      
      // Filter out static asset transactions
      if (transaction.name?.includes('/static/') || transaction.name?.includes('/assets/')) {
        return null;
      }
      
      return transaction;
    },
  };
};

// Initialize Sentry
export function initializeSentry(): void {
  try {
    const config = getSentryConfig();
    
    if (!config.dsn) {
      logger.warn('Sentry DSN not configured - error tracking disabled');
      return;
    }
    
    Sentry.init(config);
    
    // Set global tags
    Sentry.setTag('service', 'finishthisidea-backend');
    Sentry.setTag('node_version', process.version);
    
    logger.info('Sentry initialized successfully', {
      environment: config.environment,
      release: config.release,
      sampleRate: config.sampleRate,
    });
    
  } catch (error) {
    logger.error('Failed to initialize Sentry', { error });
  }
}

// Sentry utilities for enhanced error tracking
export class SentryUtils {
  /**
   * Capture exception with enhanced context
   */
  static captureException(error: Error, context?: Record<string, any>): string {
    return Sentry.captureException(error, {
      tags: {
        component: context?.component || 'unknown',
        operation: context?.operation || 'unknown',
      },
      extra: {
        ...context,
        timestamp: new Date().toISOString(),
      },
      level: 'error',
    });
  }
  
  /**
   * Capture message with context
   */
  static captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>): string {
    return Sentry.captureMessage(message, {
      level,
      tags: {
        component: context?.component || 'unknown',
      },
      extra: context,
    });
  }
  
  /**
   * Set user context for error attribution
   */
  static setUser(user: { id?: string; email?: string; username?: string; tier?: string }): void {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      segment: user.tier || 'free',
    });
  }
  
  /**
   * Add breadcrumb for debugging context
   */
  static addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
      timestamp: Date.now() / 1000,
    });
  }
  
  /**
   * Start custom transaction for performance monitoring
   */
  static startTransaction(name: string, operation: string): Sentry.Transaction {
    return Sentry.startTransaction({
      name,
      op: operation,
      tags: {
        service: 'finishthisidea',
      },
    });
  }
  
  /**
   * Track LLM API call performance
   */
  static async trackLLMCall<T>(
    provider: string,
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const transaction = Sentry.startTransaction({
      name: `llm.${provider}.${operation}`,
      op: 'llm.call',
      tags: {
        provider,
        operation,
      },
    });
    
    const span = transaction.startChild({
      op: 'llm.request',
      description: `${provider} ${operation} call`,
    });
    
    try {
      span.setData('context', context);
      const result = await fn();
      span.setStatus('ok');
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      span.setStatus('internal_error');
      transaction.setStatus('internal_error');
      
      SentryUtils.captureException(error as Error, {
        component: 'llm',
        provider,
        operation,
        ...context,
      });
      
      throw error;
    } finally {
      span.finish();
      transaction.finish();
    }
  }
  
  /**
   * Track database operation performance
   */
  static async trackDatabaseOperation<T>(
    operation: string,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const transaction = Sentry.startTransaction({
      name: `db.${table}.${operation}`,
      op: 'db.query',
      tags: {
        table,
        operation,
      },
    });
    
    try {
      const result = await fn();
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      SentryUtils.captureException(error as Error, {
        component: 'database',
        table,
        operation,
      });
      throw error;
    } finally {
      transaction.finish();
    }
  }
  
  /**
   * Track external service call performance
   */
  static async trackExternalCall<T>(
    service: string,
    operation: string,
    fn: () => Promise<T>,
    url?: string
  ): Promise<T> {
    const transaction = Sentry.startTransaction({
      name: `external.${service}.${operation}`,
      op: 'http.client',
      tags: {
        service,
        operation,
      },
    });
    
    if (url) {
      transaction.setData('url', url);
    }
    
    try {
      const result = await fn();
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      SentryUtils.captureException(error as Error, {
        component: 'external_service',
        service,
        operation,
        url,
      });
      throw error;
    } finally {
      transaction.finish();
    }
  }
}

// Custom error fingerprinting
export function setupSentryFingerprinting(): void {
  Sentry.configureScope((scope) => {
    scope.setFingerprint(['{{ default }}', process.env.NODE_ENV || 'unknown']);
  });
}

// Graceful shutdown
export function closeSentry(): Promise<boolean> {
  return Sentry.close(2000);
}

// Health check for Sentry
export function getSentryHealth(): { status: string; configured: boolean; environment: string } {
  return {
    status: 'ok',
    configured: !!process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
  };
}

export default Sentry;