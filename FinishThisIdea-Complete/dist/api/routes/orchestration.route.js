"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orchestrationRouter = void 0;
const express_1 = require("express");
const async_handler_1 = require("../../utils/async-handler");
const errors_1 = require("../../utils/errors");
const service_registry_1 = require("../../services/orchestration/service-registry");
const service_client_1 = require("../../services/orchestration/service-client");
const logger_1 = require("../../utils/logger");
const presence_logger_1 = require("../../monitoring/presence-logger");
const router = (0, express_1.Router)();
exports.orchestrationRouter = router;
router.get('/services', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const statuses = await service_registry_1.serviceRegistry.getAllServiceStatuses();
    const topology = service_registry_1.serviceRegistry.getServiceTopology();
    res.json({
        success: true,
        data: {
            services: statuses,
            topology,
            summary: {
                total: Object.keys(statuses).length,
                healthy: Object.values(statuses).filter(s => s.status === 'healthy').length,
                unhealthy: Object.values(statuses).filter(s => s.status === 'unhealthy').length,
                unknown: Object.values(statuses).filter(s => s.status === 'unknown').length
            }
        }
    });
}));
router.get('/services/:serviceName', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { serviceName } = req.params;
    const status = await service_registry_1.serviceRegistry.getServiceStatus(serviceName);
    if (!status) {
        throw new errors_1.AppError('Service not found', 404, 'SERVICE_NOT_FOUND');
    }
    res.json({
        success: true,
        data: status
    });
}));
router.get('/health', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const statuses = await service_registry_1.serviceRegistry.getAllServiceStatuses();
    const healthyServices = await service_registry_1.serviceRegistry.getHealthyServices();
    const systemHealth = {
        status: Object.values(statuses).every(s => s.status === 'healthy') ? 'healthy' : 'degraded',
        services: statuses,
        healthyCount: healthyServices.length,
        totalCount: Object.keys(statuses).length,
        timestamp: new Date().toISOString()
    };
    res.json({
        success: true,
        data: systemHealth
    });
}));
router.get('/circuit-breakers', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const circuitBreakers = service_client_1.serviceClient.getCircuitBreakerStatus();
    res.json({
        success: true,
        data: {
            circuitBreakers,
            summary: {
                total: Object.keys(circuitBreakers).length,
                open: Object.values(circuitBreakers).filter(cb => cb.state === 'open').length,
                halfOpen: Object.values(circuitBreakers).filter(cb => cb.state === 'half-open').length,
                closed: Object.values(circuitBreakers).filter(cb => cb.state === 'closed').length
            }
        }
    });
}));
router.post('/circuit-breakers/:serviceName/reset', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { serviceName } = req.params;
    const userId = req.user?.id || 'admin';
    service_client_1.serviceClient.resetCircuitBreaker(serviceName);
    await presence_logger_1.presenceLogger.logUserPresence('circuit_breaker_reset', {
        userId,
        metadata: {
            service: serviceName,
            action: 'manual_reset'
        }
    });
    logger_1.logger.info('Circuit breaker reset by admin', { serviceName, userId });
    res.json({
        success: true,
        message: `Circuit breaker reset for ${serviceName}`
    });
}));
router.post('/test/:serviceName', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { serviceName } = req.params;
    const { path = '/health', method = 'GET' } = req.body;
    try {
        const result = await service_client_1.serviceClient.request(serviceName, {
            method: method,
            path,
            timeout: 5000
        });
        res.json({
            success: true,
            data: {
                service: serviceName,
                testResult: result,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: `Service test failed: ${error.message}`,
            service: serviceName
        });
    }
}));
router.post('/test-all', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const statuses = await service_registry_1.serviceRegistry.getAllServiceStatuses();
    const services = Object.keys(statuses);
    const testResults = await Promise.allSettled(services.map(async (serviceName) => {
        try {
            const result = await service_client_1.serviceClient.get(serviceName, '/health');
            return {
                service: serviceName,
                success: result.success,
                responseTime: result.responseTime,
                status: result.statusCode
            };
        }
        catch (error) {
            return {
                service: serviceName,
                success: false,
                error: error.message,
                responseTime: 0,
                status: 0
            };
        }
    }));
    const results = testResults.map(result => result.status === 'fulfilled' ? result.value : {
        service: 'unknown',
        success: false,
        error: result.reason.message
    });
    res.json({
        success: true,
        data: {
            testResults: results,
            summary: {
                total: results.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            },
            timestamp: new Date().toISOString()
        }
    });
}));
router.get('/analytics', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { timeframe = '24h' } = req.query;
    try {
        const analytics = await presence_logger_1.presenceLogger.getAnalytics(timeframe);
        const serviceStatuses = await service_registry_1.serviceRegistry.getAllServiceStatuses();
        const circuitBreakers = service_client_1.serviceClient.getCircuitBreakerStatus();
        const serviceAnalytics = {
            timeframe,
            services: serviceStatuses,
            circuitBreakers,
            analytics,
            aggregated: {
                totalRequests: 0,
                averageResponseTime: 0,
                errorRate: 0,
                uptime: Object.values(serviceStatuses).reduce((sum, s) => sum + s.uptime, 0) / Object.keys(serviceStatuses).length
            }
        };
        res.json({
            success: true,
            data: serviceAnalytics
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get service analytics', { error });
        throw new errors_1.AppError('Failed to get service analytics', 500, 'ANALYTICS_FAILED');
    }
}));
router.post('/services/:serviceName/wait', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { serviceName } = req.params;
    const { timeout = 60000 } = req.body;
    const startTime = Date.now();
    const isHealthy = await service_registry_1.serviceRegistry.waitForService(serviceName, timeout);
    const waitTime = Date.now() - startTime;
    if (isHealthy) {
        res.json({
            success: true,
            message: `Service ${serviceName} is healthy`,
            waitTime
        });
    }
    else {
        res.status(408).json({
            success: false,
            error: `Timeout waiting for service ${serviceName}`,
            waitTime,
            timeout
        });
    }
}));
router.post('/dependencies/:serviceName/wait', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { serviceName } = req.params;
    const { timeout = 120000 } = req.body;
    const startTime = Date.now();
    const allHealthy = await service_registry_1.serviceRegistry.waitForDependencies(serviceName, timeout);
    const waitTime = Date.now() - startTime;
    if (allHealthy) {
        res.json({
            success: true,
            message: `All dependencies for ${serviceName} are healthy`,
            waitTime
        });
    }
    else {
        res.status(408).json({
            success: false,
            error: `Timeout waiting for dependencies of ${serviceName}`,
            waitTime,
            timeout
        });
    }
}));
router.get('/topology', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const topology = service_registry_1.serviceRegistry.getServiceTopology();
    const statuses = await service_registry_1.serviceRegistry.getAllServiceStatuses();
    const visualTopology = Object.entries(topology).map(([service, dependencies]) => ({
        service,
        dependencies,
        status: statuses[service]?.status || 'unknown',
        dependencyStatuses: dependencies.reduce((acc, dep) => {
            acc[dep] = statuses[dep]?.status || 'unknown';
            return acc;
        }, {})
    }));
    res.json({
        success: true,
        data: {
            topology: visualTopology,
            graph: topology
        }
    });
}));
//# sourceMappingURL=orchestration.route.js.map