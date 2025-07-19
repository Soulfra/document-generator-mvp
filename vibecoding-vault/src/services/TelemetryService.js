/**
 * TelemetryService - Comprehensive Error Tracking and System Monitoring
 * 
 * This service provides:
 * - Automatic error capture and analysis
 * - Performance monitoring
 * - User action tracking
 * - AI-powered error insights
 * - Real-time debugging capabilities
 */

import { createSafeArray, safeMap } from '../utils/safeArrayHelpers';

class TelemetryService {
  constructor() {
    this.errors = [];
    this.performanceMetrics = [];
    this.userActions = [];
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.errorPatterns = new Map();
    this.aiAnalysisQueue = [];
    this.wsConnection = null;
    this.isInitialized = false;
    this.config = {
      maxErrors: 1000,
      maxActions: 500,
      maxMetrics: 500,
      enableAIAnalysis: true,
      enableRealtime: true,
      enableSourceMaps: true,
      captureScreenshots: false,
      captureNetworkErrors: true,
      captureConsoleErrors: true,
      aiAnalysisThreshold: 3, // Analyze after N similar errors
      errorGroupingWindow: 5000, // 5 seconds
    };
  }

  /**
   * Initialize telemetry service
   */
  initialize() {
    if (this.isInitialized) return;

    // Set up global error handlers
    this.setupErrorHandlers();
    
    // Set up performance monitoring
    this.setupPerformanceMonitoring();
    
    // Set up user action tracking
    this.setupUserActionTracking();
    
    // Set up console interceptors
    this.setupConsoleInterceptors();
    
    // Set up network monitoring
    this.setupNetworkMonitoring();
    
    // Initialize WebSocket for real-time telemetry
    this.initializeWebSocket();
    
    // Set up periodic cleanup
    this.setupCleanup();
    
    this.isInitialized = true;
    console.log('[Telemetry] Service initialized', {
      sessionId: this.sessionId,
      config: this.config
    });
  }

  /**
   * Capture and analyze an error
   */
  captureError(error, context = {}) {
    const errorInfo = this.parseError(error);
    const enhancedError = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      error: errorInfo,
      context: {
        ...context,
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        memory: this.getMemoryInfo(),
        performance: this.getCurrentPerformance()
      },
      stackTrace: this.parseStackTrace(error),
      userActions: this.getRecentUserActions(10),
      groupId: this.getErrorGroupId(errorInfo),
      severity: this.calculateSeverity(errorInfo, context)
    };

    // Store error
    this.errors.push(enhancedError);
    this.trimErrors();

    // Pattern matching
    this.updateErrorPatterns(enhancedError);

    // Check if we should trigger AI analysis
    if (this.shouldAnalyzeError(enhancedError)) {
      this.queueAIAnalysis(enhancedError);
    }

    // Send to backend if available
    this.sendToBackend('error', enhancedError);

    // Emit real-time update
    this.emitRealtimeUpdate('error', enhancedError);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`[Telemetry] Error Captured`);
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('Enhanced Error:', enhancedError);
      console.groupEnd();
    }

    return enhancedError;
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric, value, metadata = {}) {
    const performanceEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      metric,
      value,
      metadata,
      sessionId: this.sessionId
    };

    this.performanceMetrics.push(performanceEntry);
    this.trimPerformanceMetrics();

    // Check for performance issues
    this.checkPerformanceThresholds(metric, value);

    // Send to backend
    this.sendToBackend('performance', performanceEntry);

    return performanceEntry;
  }

  /**
   * Track user action
   */
  trackUserAction(action, target, metadata = {}) {
    const actionEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      action,
      target,
      metadata,
      sessionId: this.sessionId,
      path: this.getElementPath(target)
    };

    this.userActions.push(actionEntry);
    this.trimUserActions();

    // Send to backend
    this.sendToBackend('action', actionEntry);

    return actionEntry;
  }

  /**
   * Get telemetry summary
   */
  getSummary() {
    const errorsByType = this.groupErrorsByType();
    const performanceSummary = this.calculatePerformanceSummary();
    const userActionsSummary = this.calculateUserActionsSummary();

    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.startTime,
      errors: {
        total: this.errors.length,
        byType: errorsByType,
        patterns: Array.from(this.errorPatterns.entries()),
        recent: this.errors.slice(-10)
      },
      performance: performanceSummary,
      userActions: userActionsSummary,
      health: this.calculateHealthScore()
    };
  }

  /**
   * Get error insights using AI
   */
  async getAIInsights(errorId) {
    const error = this.errors.find(e => e.id === errorId);
    if (!error) return null;

    try {
      const insights = await this.analyzeErrorWithAI(error);
      return insights;
    } catch (err) {
      console.error('[Telemetry] AI analysis failed:', err);
      return null;
    }
  }

  /**
   * Clear all telemetry data
   */
  clear() {
    this.errors = [];
    this.performanceMetrics = [];
    this.userActions = [];
    this.errorPatterns.clear();
    console.log('[Telemetry] Data cleared');
  }

  /**
   * Export telemetry data
   */
  export() {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      exportTime: Date.now(),
      errors: this.errors,
      performanceMetrics: this.performanceMetrics,
      userActions: this.userActions,
      errorPatterns: Array.from(this.errorPatterns.entries()),
      summary: this.getSummary()
    };
  }

  // Private methods

  setupErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError(event.error || event, {
        type: 'window-error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        type: 'unhandled-rejection',
        promise: event.promise
      });
    });

    // React Error Boundary integration helper
    window.__telemetryReportError = (error, errorInfo) => {
      this.captureError(error, {
        type: 'react-error-boundary',
        componentStack: errorInfo.componentStack
      });
    };
  }

  setupPerformanceMonitoring() {
    // Navigation timing
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        this.trackPerformance('page-load', loadTime, { timing });
      });
    }

    // Long task observer
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Long task threshold
              this.trackPerformance('long-task', entry.duration, {
                name: entry.name,
                startTime: entry.startTime
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (err) {
        console.warn('[Telemetry] Long task observer not supported');
      }
    }
  }

  setupUserActionTracking() {
    // Click tracking
    document.addEventListener('click', (event) => {
      const target = event.target;
      const actionInfo = {
        tagName: target.tagName,
        id: target.id,
        className: target.className,
        text: target.textContent?.substring(0, 50)
      };
      this.trackUserAction('click', target, actionInfo);
    }, true);

    // Form submission tracking
    document.addEventListener('submit', (event) => {
      const form = event.target;
      this.trackUserAction('form-submit', form, {
        formId: form.id,
        formName: form.name,
        method: form.method,
        action: form.action
      });
    }, true);

    // Navigation tracking
    let lastUrl = window.location.href;
    const checkNavigation = () => {
      if (window.location.href !== lastUrl) {
        this.trackUserAction('navigation', null, {
          from: lastUrl,
          to: window.location.href
        });
        lastUrl = window.location.href;
      }
    };
    setInterval(checkNavigation, 1000);
  }

  setupConsoleInterceptors() {
    if (!this.config.captureConsoleErrors) return;

    const originalError = console.error;
    console.error = (...args) => {
      this.captureError(new Error(args.join(' ')), {
        type: 'console-error',
        arguments: args
      });
      originalError.apply(console, args);
    };

    const originalWarn = console.warn;
    console.warn = (...args) => {
      // Track warnings but don't treat as errors
      this.trackUserAction('console-warn', null, {
        message: args.join(' ')
      });
      originalWarn.apply(console, args);
    };
  }

  setupNetworkMonitoring() {
    if (!this.config.captureNetworkErrors) return;

    // Intercept fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        // Track performance
        this.trackPerformance('network-request', duration, {
          url: args[0],
          method: args[1]?.method || 'GET',
          status: response.status
        });

        // Capture network errors
        if (!response.ok) {
          this.captureError(new Error(`Network request failed: ${response.status}`), {
            type: 'network-error',
            url: args[0],
            status: response.status,
            statusText: response.statusText
          });
        }

        return response;
      } catch (error) {
        this.captureError(error, {
          type: 'network-error',
          url: args[0],
          method: args[1]?.method || 'GET'
        });
        throw error;
      }
    };

    // Intercept XHR
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this._telemetryUrl = url;
      this._telemetryMethod = method;
      this._telemetryStartTime = Date.now();
      return originalXHROpen.apply(this, [method, url, ...rest]);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      this.addEventListener('loadend', () => {
        const duration = Date.now() - this._telemetryStartTime;
        telemetry.trackPerformance('xhr-request', duration, {
          url: this._telemetryUrl,
          method: this._telemetryMethod,
          status: this.status
        });

        if (this.status >= 400) {
          telemetry.captureError(new Error(`XHR request failed: ${this.status}`), {
            type: 'xhr-error',
            url: this._telemetryUrl,
            status: this.status,
            statusText: this.statusText
          });
        }
      });

      return originalXHRSend.apply(this, args);
    };
  }

  initializeWebSocket() {
    if (!this.config.enableRealtime) return;

    try {
      // Connect to telemetry WebSocket endpoint
      this.wsConnection = new WebSocket(`ws://localhost:3001/telemetry`);
      
      this.wsConnection.onopen = () => {
        console.log('[Telemetry] WebSocket connected');
        this.wsConnection.send(JSON.stringify({
          type: 'register',
          sessionId: this.sessionId
        }));
      };

      this.wsConnection.onerror = (error) => {
        console.warn('[Telemetry] WebSocket error:', error);
      };

      this.wsConnection.onclose = () => {
        console.log('[Telemetry] WebSocket disconnected');
        // Attempt reconnection after 5 seconds
        setTimeout(() => this.initializeWebSocket(), 5000);
      };
    } catch (error) {
      console.warn('[Telemetry] WebSocket initialization failed:', error);
    }
  }

  setupCleanup() {
    // Periodic cleanup to prevent memory leaks
    setInterval(() => {
      this.trimErrors();
      this.trimPerformanceMetrics();
      this.trimUserActions();
    }, 60000); // Every minute
  }

  // Utility methods

  parseError(error) {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      };
    } else if (typeof error === 'string') {
      return {
        name: 'StringError',
        message: error,
        type: 'string'
      };
    } else {
      return {
        name: 'UnknownError',
        message: JSON.stringify(error),
        type: typeof error
      };
    }
  }

  parseStackTrace(error) {
    if (!error.stack) return [];
    
    const lines = error.stack.split('\n');
    return safeMap(lines, line => {
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
      if (match) {
        return {
          function: match[1],
          file: match[2],
          line: parseInt(match[3]),
          column: parseInt(match[4])
        };
      }
      return { raw: line };
    });
  }

  getMemoryInfo() {
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  getCurrentPerformance() {
    return {
      errorCount: this.errors.length,
      actionCount: this.userActions.length,
      uptime: Date.now() - this.startTime
    };
  }

  getRecentUserActions(count = 10) {
    return this.userActions.slice(-count);
  }

  getErrorGroupId(errorInfo) {
    // Group similar errors together
    const key = `${errorInfo.name}-${errorInfo.message}`.replace(/\d+/g, 'N');
    return this.hashString(key);
  }

  calculateSeverity(errorInfo, context) {
    // Calculate error severity based on various factors
    if (context.type === 'react-error-boundary') return 'high';
    if (errorInfo.name === 'TypeError') return 'high';
    if (errorInfo.name === 'ReferenceError') return 'high';
    if (context.type === 'network-error' && context.status >= 500) return 'high';
    if (context.type === 'console-error') return 'medium';
    return 'low';
  }

  getElementPath(element) {
    if (!element || !element.tagName) return '';
    
    const path = [];
    let current = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        selector += `#${current.id}`;
      } else if (current.className) {
        selector += `.${current.className.split(' ')[0]}`;
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }

  updateErrorPatterns(error) {
    const pattern = error.groupId;
    const existing = this.errorPatterns.get(pattern) || {
      count: 0,
      firstSeen: error.timestamp,
      lastSeen: error.timestamp,
      examples: []
    };
    
    existing.count++;
    existing.lastSeen = error.timestamp;
    if (existing.examples.length < 3) {
      existing.examples.push(error);
    }
    
    this.errorPatterns.set(pattern, existing);
  }

  shouldAnalyzeError(error) {
    if (!this.config.enableAIAnalysis) return false;
    
    const pattern = this.errorPatterns.get(error.groupId);
    return pattern && pattern.count >= this.config.aiAnalysisThreshold;
  }

  async queueAIAnalysis(error) {
    this.aiAnalysisQueue.push(error);
    
    // Process queue
    if (this.aiAnalysisQueue.length === 1) {
      setTimeout(() => this.processAIAnalysisQueue(), 1000);
    }
  }

  async processAIAnalysisQueue() {
    while (this.aiAnalysisQueue.length > 0) {
      const error = this.aiAnalysisQueue.shift();
      try {
        const insights = await this.analyzeErrorWithAI(error);
        error.aiInsights = insights;
        this.emitRealtimeUpdate('ai-insights', { errorId: error.id, insights });
      } catch (err) {
        console.error('[Telemetry] AI analysis failed:', err);
      }
    }
  }

  async analyzeErrorWithAI(error) {
    // This would integrate with your AI service
    // For now, return mock insights
    return {
      possibleCauses: [
        'Undefined variable access',
        'Missing null check',
        'Async operation not handled properly'
      ],
      suggestedFixes: [
        'Add null/undefined check before accessing properties',
        'Use optional chaining operator (?.) for safe access',
        'Wrap in try-catch block for error handling'
      ],
      similarErrors: this.findSimilarErrors(error),
      confidence: 0.85
    };
  }

  findSimilarErrors(error) {
    return safeMap(
      this.errors.filter(e => 
        e.id !== error.id && 
        e.groupId === error.groupId
      ).slice(0, 3),
      e => ({
        id: e.id,
        timestamp: e.timestamp,
        context: e.context
      })
    );
  }

  sendToBackend(type, data) {
    // Send telemetry data to backend
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        type: `telemetry-${type}`,
        sessionId: this.sessionId,
        data
      }));
    }
    
    // Also try HTTP fallback
    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, sessionId: this.sessionId, data })
    }).catch(() => {
      // Silently fail, telemetry shouldn't break the app
    });
  }

  emitRealtimeUpdate(event, data) {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        type: 'realtime-update',
        event,
        data
      }));
    }
    
    // Also emit custom event for local listeners
    window.dispatchEvent(new CustomEvent(`telemetry:${event}`, { detail: data }));
  }

  // Utility functions

  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateErrorId() {
    return `error-${this.generateId()}`;
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  groupErrorsByType() {
    const groups = {};
    for (const error of this.errors) {
      const type = error.error.name;
      groups[type] = (groups[type] || 0) + 1;
    }
    return groups;
  }

  calculatePerformanceSummary() {
    const metrics = {};
    for (const entry of this.performanceMetrics) {
      if (!metrics[entry.metric]) {
        metrics[entry.metric] = {
          count: 0,
          total: 0,
          min: Infinity,
          max: -Infinity,
          avg: 0
        };
      }
      const m = metrics[entry.metric];
      m.count++;
      m.total += entry.value;
      m.min = Math.min(m.min, entry.value);
      m.max = Math.max(m.max, entry.value);
      m.avg = m.total / m.count;
    }
    return metrics;
  }

  calculateUserActionsSummary() {
    const actions = {};
    for (const action of this.userActions) {
      actions[action.action] = (actions[action.action] || 0) + 1;
    }
    return {
      total: this.userActions.length,
      byType: actions,
      recent: this.userActions.slice(-5)
    };
  }

  calculateHealthScore() {
    const errorRate = this.errors.length / ((Date.now() - this.startTime) / 60000); // errors per minute
    const highSeverityErrors = this.errors.filter(e => e.severity === 'high').length;
    
    let score = 100;
    score -= errorRate * 5; // -5 points per error/minute
    score -= highSeverityErrors * 10; // -10 points per high severity error
    
    return Math.max(0, Math.min(100, score));
  }

  checkPerformanceThresholds(metric, value) {
    const thresholds = {
      'page-load': 3000,
      'long-task': 100,
      'network-request': 1000,
      'xhr-request': 1000
    };
    
    if (thresholds[metric] && value > thresholds[metric]) {
      this.captureError(new Error(`Performance threshold exceeded: ${metric}`), {
        type: 'performance-warning',
        metric,
        value,
        threshold: thresholds[metric]
      });
    }
  }

  trimErrors() {
    if (this.errors.length > this.config.maxErrors) {
      this.errors = this.errors.slice(-this.config.maxErrors);
    }
  }

  trimPerformanceMetrics() {
    if (this.performanceMetrics.length > this.config.maxMetrics) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.config.maxMetrics);
    }
  }

  trimUserActions() {
    if (this.userActions.length > this.config.maxActions) {
      this.userActions = this.userActions.slice(-this.config.maxActions);
    }
  }
}

// Create and export singleton instance
const telemetry = new TelemetryService();

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => telemetry.initialize());
  } else {
    telemetry.initialize();
  }
}

export default telemetry;