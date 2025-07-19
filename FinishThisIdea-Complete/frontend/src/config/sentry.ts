/**
 * FRONTEND SENTRY CONFIGURATION
 * 
 * React Sentry configuration for error tracking, performance monitoring,
 * and user experience insights
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

// Sentry configuration interface
interface FrontendSentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  sampleRate: number;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  integrations: Sentry.Integration[];
  beforeSend?: (event: Sentry.Event) => Sentry.Event | null;
}

// Environment-specific configuration
const getSentryConfig = (): FrontendSentryConfig => {
  const isProduction = import.meta.env.MODE === 'production';
  const isDevelopment = import.meta.env.MODE === 'development';
  
  return {
    dsn: import.meta.env.VITE_SENTRY_DSN || '',
    environment: import.meta.env.MODE || 'development',
    release: `finishthisidea-frontend@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    
    // Sample rates - more conservative for frontend
    sampleRate: isProduction ? 1.0 : 0.3,
    tracesSampleRate: isProduction ? 0.1 : 0.05,
    replaysSessionSampleRate: isProduction ? 0.1 : 0.0,
    replaysOnErrorSampleRate: isProduction ? 1.0 : 0.5,
    
    integrations: [
      new BrowserTracing({
        // Performance monitoring for React Router
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
        
        // Track user interactions
        tracingOrigins: [
          'localhost',
          /^https:\/\/api\.finishthisidea\.com\/api/,
          /^https:\/\/finishthisidea\.com/,
        ],
        
        // Custom performance tracking
        beforeNavigate: (context) => {
          return {
            ...context,
            name: `${context.location.pathname}`,
            tags: {
              'routing.instrumentation': 'react-router-v6',
            },
          };
        },
      }),
      
      // Session replay for debugging
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: true,
        maskAllInputs: true,
      }),
    ],
    
    // Event filtering and enhancement
    beforeSend: (event) => {
      // Filter out development noise
      if (isDevelopment) {
        // Skip console errors in development
        if (event.exception?.values?.[0]?.type === 'console') {
          return null;
        }
        
        // Skip network errors in development
        if (event.exception?.values?.[0]?.value?.includes('NetworkError')) {
          return null;
        }
      }
      
      // Filter out chunk loading errors (common in SPAs)
      if (event.exception?.values?.[0]?.value?.includes('Loading chunk')) {
        return null;
      }
      
      // Filter out extension errors
      if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
        frame => frame.filename?.includes('extension://')
      )) {
        return null;
      }
      
      // Add browser context
      if (event.contexts) {
        event.contexts.browser_info = {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
          screen: {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth,
          },
        };
      }
      
      return event;
    },
  };
};

// React imports for routing instrumentation
import React, { useEffect } from 'react';
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom';

// Initialize Sentry for React
export function initializeFrontendSentry(): void {
  try {
    const config = getSentryConfig();
    
    if (!config.dsn) {
      console.warn('Sentry DSN not configured - error tracking disabled');
      return;
    }
    
    Sentry.init(config);
    
    // Set global tags
    Sentry.setTag('component', 'frontend');
    Sentry.setTag('framework', 'react');
    Sentry.setTag('build_tool', 'vite');
    
    console.log('Frontend Sentry initialized', {
      environment: config.environment,
      release: config.release,
    });
    
  } catch (error) {
    console.error('Failed to initialize frontend Sentry', error);
  }
}

// Frontend Sentry utilities
export class FrontendSentryUtils {
  /**
   * Capture exception with enhanced context
   */
  static captureException(error: Error, context?: Record<string, any>): string {
    return Sentry.captureException(error, {
      tags: {
        component: context?.component || 'unknown',
        operation: context?.operation || 'unknown',
        route: window.location.pathname,
      },
      extra: {
        ...context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer,
      },
      level: 'error',
    });
  }
  
  /**
   * Capture user interaction events
   */
  static captureUserEvent(action: string, target?: string, context?: Record<string, any>): void {
    Sentry.addBreadcrumb({
      message: `User ${action}`,
      category: 'user',
      data: {
        action,
        target,
        ...context,
        timestamp: new Date().toISOString(),
        url: window.location.pathname,
      },
      level: 'info',
    });
  }
  
  /**
   * Track API call performance
   */
  static async trackApiCall<T>(
    endpoint: string,
    method: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const transaction = Sentry.startTransaction({
      name: `API ${method} ${endpoint}`,
      op: 'http.client',
      tags: {
        endpoint,
        method,
      },
    });
    
    const span = transaction.startChild({
      op: 'http.request',
      description: `${method} ${endpoint}`,
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
      
      FrontendSentryUtils.captureException(error as Error, {
        component: 'api',
        endpoint,
        method,
        ...context,
      });
      
      throw error;
    } finally {
      span.finish();
      transaction.finish();
    }
  }
  
  /**
   * Track component lifecycle and performance
   */
  static trackComponentRender(componentName: string, props?: Record<string, any>): () => void {
    const transaction = Sentry.startTransaction({
      name: `Component ${componentName}`,
      op: 'react.render',
      tags: {
        component: componentName,
      },
    });
    
    if (props) {
      transaction.setData('props', props);
    }
    
    return () => {
      transaction.finish();
    };
  }
  
  /**
   * Track file upload progress
   */
  static trackFileUpload(fileName: string, fileSize: number): {
    updateProgress: (progress: number) => void;
    finish: (success: boolean) => void;
  } {
    const transaction = Sentry.startTransaction({
      name: 'File Upload',
      op: 'upload',
      tags: {
        fileName,
        fileSize: fileSize.toString(),
      },
    });
    
    const span = transaction.startChild({
      op: 'upload.file',
      description: `Upload ${fileName}`,
    });
    
    return {
      updateProgress: (progress: number) => {
        span.setData('progress', progress);
      },
      finish: (success: boolean) => {
        if (success) {
          span.setStatus('ok');
          transaction.setStatus('ok');
        } else {
          span.setStatus('internal_error');
          transaction.setStatus('internal_error');
        }
        span.finish();
        transaction.finish();
      },
    };
  }
  
  /**
   * Set user context
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
   * Track feature usage
   */
  static trackFeatureUsage(feature: string, action: string, context?: Record<string, any>): void {
    Sentry.addBreadcrumb({
      message: `Feature: ${feature} - ${action}`,
      category: 'feature',
      data: {
        feature,
        action,
        ...context,
        timestamp: new Date().toISOString(),
        url: window.location.pathname,
      },
      level: 'info',
    });
  }
  
  /**
   * Track performance metrics
   */
  static trackPerformanceMetric(name: string, value: number, unit: string): void {
    const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
    
    if (transaction) {
      transaction.setMeasurement(name, value, unit);
    }
    
    Sentry.addBreadcrumb({
      message: `Performance: ${name}`,
      category: 'performance',
      data: {
        metric: name,
        value,
        unit,
        timestamp: new Date().toISOString(),
      },
      level: 'info',
    });
  }
}

// React Error Boundary with Sentry integration
export const SentryErrorBoundary = Sentry.withErrorBoundary;

// React Profiler with Sentry integration
export const SentryProfiler = Sentry.withProfiler;

// HOC for automatic error boundary and performance tracking
export function withSentryMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = Sentry.withErrorBoundary(
    Sentry.withProfiler(Component, { name: componentName || Component.name }),
    {
      fallback: ({ error, resetError }) => (
        <div className="error-boundary p-4 border border-red-300 rounded-lg bg-red-50">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600 mb-4">
            We've been notified about this error and are working to fix it.
          </p>
          <button
            onClick={resetError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try again
          </button>
          {import.meta.env.MODE === 'development' && (
            <details className="mt-4">
              <summary className="cursor-pointer text-red-800">Error details</summary>
              <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">
                {error.toString()}
              </pre>
            </details>
          )}
        </div>
      ),
      beforeCapture: (scope, error, info) => {
        scope.setTag('errorBoundary', true);
        scope.setContext('errorInfo', info);
        scope.setLevel('error');
      },
    }
  );
  
  WrappedComponent.displayName = `withSentryMonitoring(${componentName || Component.name})`;
  
  return WrappedComponent;
}

// Performance observer for Core Web Vitals
export function setupPerformanceObserver(): void {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        FrontendSentryUtils.trackPerformanceMetric(
          'largest_contentful_paint',
          entry.startTime,
          'millisecond'
        );
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    
    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        FrontendSentryUtils.trackPerformanceMetric(
          'first_input_delay',
          (entry as any).processingStart - entry.startTime,
          'millisecond'
        );
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
    
    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      FrontendSentryUtils.trackPerformanceMetric(
        'cumulative_layout_shift',
        clsValue,
        'score'
      );
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }
}

export default Sentry;