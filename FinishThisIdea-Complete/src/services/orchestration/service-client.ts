/**
 * SERVICE CLIENT
 * 
 * Handles secure inter-service communication with automatic service discovery,
 * retry logic, circuit breaker pattern, and authentication
 */

import { logger } from '../../utils/logger';
import { serviceRegistry } from './service-registry';

export interface ServiceRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
  headers: Record<string, string>;
  responseTime: number;
}

export interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
  nextAttempt: number;
}

export class ServiceClient {
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private readonly MAX_FAILURES = 5;
  private readonly RECOVERY_TIMEOUT = 30000; // 30 seconds
  private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds

  constructor() {
    this.initializeCircuitBreakers();
  }

  private initializeCircuitBreakers(): void {
    // Initialize circuit breakers for known services
    const services = ['finishthisidea-app', 'finishthisidea-ai-api', 'finishthisidea-analytics'];
    
    services.forEach(service => {
      this.circuitBreakers.set(service, {
        failures: 0,
        lastFailureTime: 0,
        state: 'closed',
        nextAttempt: 0
      });
    });
  }

  /**
   * Make a request to another service
   */
  async request<T = any>(
    serviceName: string, 
    request: ServiceRequest
  ): Promise<ServiceResponse<T>> {
    const startTime = Date.now();

    try {
      // Check circuit breaker
      if (!(await this.canMakeRequest(serviceName))) {
        return {
          success: false,
          error: 'Service circuit breaker is open',
          statusCode: 503,
          headers: {},
          responseTime: Date.now() - startTime
        };
      }

      // Get service URL from registry
      const serviceUrl = await serviceRegistry.getServiceUrl(serviceName);
      if (!serviceUrl) {
        await this.recordFailure(serviceName);
        return {
          success: false,
          error: 'Service not available',
          statusCode: 503,
          headers: {},
          responseTime: Date.now() - startTime
        };
      }

      // Prepare request
      const url = `${serviceUrl}${request.path}`;
      const options: RequestInit = {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FinishThisIdea-ServiceClient/1.0',
          'X-Service-Name': 'finishthisidea-orchestrator',
          ...this.getAuthHeaders(),
          ...request.headers
        },
        signal: AbortSignal.timeout(request.timeout || this.DEFAULT_TIMEOUT)
      };

      if (request.data && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
        options.body = JSON.stringify(request.data);
      }

      // Make request with retry logic
      const response = await this.makeRequestWithRetry(url, options, serviceName);
      const responseTime = Date.now() - startTime;

      // Parse response
      let data: T | undefined;
      const responseHeaders: Record<string, string> = {};
      
      // Extract headers
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : undefined;
      } catch (error) {
        // Response is not JSON, that's okay
      }

      const result: ServiceResponse<T> = {
        success: response.ok,
        data,
        statusCode: response.status,
        headers: responseHeaders,
        responseTime
      };

      if (response.ok) {
        await this.recordSuccess(serviceName);
      } else {
        await this.recordFailure(serviceName);
        result.error = `Service returned ${response.status}: ${response.statusText}`;
      }

      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      await this.recordFailure(serviceName);

      logger.error('Service request failed', {
        service: serviceName,
        path: request.path,
        method: request.method,
        error: error.message,
        responseTime
      });

      return {
        success: false,
        error: error.message,
        statusCode: error.name === 'AbortError' ? 408 : 500,
        headers: {},
        responseTime
      };
    }
  }

  /**
   * Make GET request to a service
   */
  async get<T = any>(serviceName: string, path: string, headers?: Record<string, string>): Promise<ServiceResponse<T>> {
    return this.request<T>(serviceName, {
      method: 'GET',
      path,
      headers
    });
  }

  /**
   * Make POST request to a service
   */
  async post<T = any>(serviceName: string, path: string, data?: any, headers?: Record<string, string>): Promise<ServiceResponse<T>> {
    return this.request<T>(serviceName, {
      method: 'POST',
      path,
      data,
      headers
    });
  }

  /**
   * Make PUT request to a service
   */
  async put<T = any>(serviceName: string, path: string, data?: any, headers?: Record<string, string>): Promise<ServiceResponse<T>> {
    return this.request<T>(serviceName, {
      method: 'PUT',
      path,
      data,
      headers
    });
  }

  /**
   * Make DELETE request to a service
   */
  async delete<T = any>(serviceName: string, path: string, headers?: Record<string, string>): Promise<ServiceResponse<T>> {
    return this.request<T>(serviceName, {
      method: 'DELETE',
      path,
      headers
    });
  }

  private async makeRequestWithRetry(url: string, options: RequestInit, serviceName: string, retries: number = 3): Promise<Response> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url, options);
        
        // Don't retry on client errors (4xx), only server errors (5xx) and network errors
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response;
        }

        if (attempt === retries - 1) {
          return response; // Last attempt, return whatever we got
        }

        // Wait before retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (error) {
        if (attempt === retries - 1) {
          throw error; // Last attempt, throw the error
        }

        // Wait before retry
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('All retry attempts failed');
  }

  private async canMakeRequest(serviceName: string): Promise<boolean> {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) return true;

    const now = Date.now();

    switch (breaker.state) {
      case 'closed':
        return true;

      case 'open':
        if (now >= breaker.nextAttempt) {
          breaker.state = 'half-open';
          return true;
        }
        return false;

      case 'half-open':
        return true;

      default:
        return true;
    }
  }

  private async recordSuccess(serviceName: string): Promise<void> {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) return;

    breaker.failures = 0;
    breaker.state = 'closed';
    
    logger.debug('Service request succeeded', { service: serviceName });
  }

  private async recordFailure(serviceName: string): Promise<void> {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) return;

    breaker.failures += 1;
    breaker.lastFailureTime = Date.now();

    if (breaker.failures >= this.MAX_FAILURES) {
      breaker.state = 'open';
      breaker.nextAttempt = Date.now() + this.RECOVERY_TIMEOUT;
      
      logger.warn('Service circuit breaker opened', {
        service: serviceName,
        failures: breaker.failures,
        nextAttempt: new Date(breaker.nextAttempt)
      });
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // Add internal API key for service-to-service communication
    const internalKey = process.env.INTERNAL_API_KEY;
    if (internalKey) {
      headers['Authorization'] = `Bearer ${internalKey}`;
    }

    return headers;
  }

  /**
   * Get circuit breaker status for all services
   */
  getCircuitBreakerStatus(): Record<string, CircuitBreakerState> {
    const status: Record<string, CircuitBreakerState> = {};
    
    for (const [service, breaker] of this.circuitBreakers.entries()) {
      status[service] = { ...breaker };
    }
    
    return status;
  }

  /**
   * Reset circuit breaker for a service
   */
  resetCircuitBreaker(serviceName: string): void {
    const breaker = this.circuitBreakers.get(serviceName);
    if (breaker) {
      breaker.failures = 0;
      breaker.state = 'closed';
      breaker.nextAttempt = 0;
      
      logger.info('Circuit breaker reset', { service: serviceName });
    }
  }
}

// Singleton instance
export const serviceClient = new ServiceClient();