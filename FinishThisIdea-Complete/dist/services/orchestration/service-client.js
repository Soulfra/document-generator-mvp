"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceClient = exports.ServiceClient = void 0;
const logger_1 = require("../../utils/logger");
const service_registry_1 = require("./service-registry");
class ServiceClient {
    circuitBreakers = new Map();
    MAX_FAILURES = 5;
    RECOVERY_TIMEOUT = 30000;
    DEFAULT_TIMEOUT = 10000;
    constructor() {
        this.initializeCircuitBreakers();
    }
    initializeCircuitBreakers() {
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
    async request(serviceName, request) {
        const startTime = Date.now();
        try {
            if (!(await this.canMakeRequest(serviceName))) {
                return {
                    success: false,
                    error: 'Service circuit breaker is open',
                    statusCode: 503,
                    headers: {},
                    responseTime: Date.now() - startTime
                };
            }
            const serviceUrl = await service_registry_1.serviceRegistry.getServiceUrl(serviceName);
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
            const url = `${serviceUrl}${request.path}`;
            const options = {
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
            const response = await this.makeRequestWithRetry(url, options, serviceName);
            const responseTime = Date.now() - startTime;
            let data;
            const responseHeaders = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });
            try {
                const text = await response.text();
                data = text ? JSON.parse(text) : undefined;
            }
            catch (error) {
            }
            const result = {
                success: response.ok,
                data,
                statusCode: response.status,
                headers: responseHeaders,
                responseTime
            };
            if (response.ok) {
                await this.recordSuccess(serviceName);
            }
            else {
                await this.recordFailure(serviceName);
                result.error = `Service returned ${response.status}: ${response.statusText}`;
            }
            return result;
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            await this.recordFailure(serviceName);
            logger_1.logger.error('Service request failed', {
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
    async get(serviceName, path, headers) {
        return this.request(serviceName, {
            method: 'GET',
            path,
            headers
        });
    }
    async post(serviceName, path, data, headers) {
        return this.request(serviceName, {
            method: 'POST',
            path,
            data,
            headers
        });
    }
    async put(serviceName, path, data, headers) {
        return this.request(serviceName, {
            method: 'PUT',
            path,
            data,
            headers
        });
    }
    async delete(serviceName, path, headers) {
        return this.request(serviceName, {
            method: 'DELETE',
            path,
            headers
        });
    }
    async makeRequestWithRetry(url, options, serviceName, retries = 3) {
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const response = await fetch(url, options);
                if (response.ok || (response.status >= 400 && response.status < 500)) {
                    return response;
                }
                if (attempt === retries - 1) {
                    return response;
                }
                const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            catch (error) {
                if (attempt === retries - 1) {
                    throw error;
                }
                const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw new Error('All retry attempts failed');
    }
    async canMakeRequest(serviceName) {
        const breaker = this.circuitBreakers.get(serviceName);
        if (!breaker)
            return true;
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
    async recordSuccess(serviceName) {
        const breaker = this.circuitBreakers.get(serviceName);
        if (!breaker)
            return;
        breaker.failures = 0;
        breaker.state = 'closed';
        logger_1.logger.debug('Service request succeeded', { service: serviceName });
    }
    async recordFailure(serviceName) {
        const breaker = this.circuitBreakers.get(serviceName);
        if (!breaker)
            return;
        breaker.failures += 1;
        breaker.lastFailureTime = Date.now();
        if (breaker.failures >= this.MAX_FAILURES) {
            breaker.state = 'open';
            breaker.nextAttempt = Date.now() + this.RECOVERY_TIMEOUT;
            logger_1.logger.warn('Service circuit breaker opened', {
                service: serviceName,
                failures: breaker.failures,
                nextAttempt: new Date(breaker.nextAttempt)
            });
        }
    }
    getAuthHeaders() {
        const headers = {};
        const internalKey = process.env.INTERNAL_API_KEY;
        if (internalKey) {
            headers['Authorization'] = `Bearer ${internalKey}`;
        }
        return headers;
    }
    getCircuitBreakerStatus() {
        const status = {};
        for (const [service, breaker] of this.circuitBreakers.entries()) {
            status[service] = { ...breaker };
        }
        return status;
    }
    resetCircuitBreaker(serviceName) {
        const breaker = this.circuitBreakers.get(serviceName);
        if (breaker) {
            breaker.failures = 0;
            breaker.state = 'closed';
            breaker.nextAttempt = 0;
            logger_1.logger.info('Circuit breaker reset', { service: serviceName });
        }
    }
}
exports.ServiceClient = ServiceClient;
exports.serviceClient = new ServiceClient();
//# sourceMappingURL=service-client.js.map