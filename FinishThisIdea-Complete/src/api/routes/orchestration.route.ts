/**
 * SERVICE ORCHESTRATION MANAGEMENT ROUTES
 * 
 * Admin endpoints for managing service orchestration, health checks,
 * circuit breakers, and service discovery
 */

import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { AppError } from '../../utils/errors';
import { serviceRegistry } from '../../services/orchestration/service-registry';
import { serviceClient } from '../../services/orchestration/service-client';
import { logger } from '../../utils/logger';
import { presenceLogger } from '../../monitoring/presence-logger';

const router = Router();

// ============================================================================
// 📊 SERVICE REGISTRY ENDPOINTS
// ============================================================================

/**
 * GET /api/orchestration/services
 * Get all registered services and their current status
 */
router.get(
  '/services',
  asyncHandler(async (req, res) => {
    const statuses = await serviceRegistry.getAllServiceStatuses();
    const topology = serviceRegistry.getServiceTopology();
    
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
  })
);

/**
 * GET /api/orchestration/services/:serviceName
 * Get detailed status for a specific service
 */
router.get(
  '/services/:serviceName',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;
    const status = await serviceRegistry.getServiceStatus(serviceName);
    
    if (!status) {
      throw new AppError('Service not found', 404, 'SERVICE_NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: status
    });
  })
);

/**
 * GET /api/orchestration/health
 * Get overall system health
 */
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    const statuses = await serviceRegistry.getAllServiceStatuses();
    const healthyServices = await serviceRegistry.getHealthyServices();
    
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
  })
);

// ============================================================================
// 🔄 CIRCUIT BREAKER MANAGEMENT
// ============================================================================

/**
 * GET /api/orchestration/circuit-breakers
 * Get circuit breaker status for all services
 */
router.get(
  '/circuit-breakers',
  asyncHandler(async (req, res) => {
    const circuitBreakers = serviceClient.getCircuitBreakerStatus();
    
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
  })
);

/**
 * POST /api/orchestration/circuit-breakers/:serviceName/reset
 * Reset circuit breaker for a specific service
 */
router.post(
  '/circuit-breakers/:serviceName/reset',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;
    const userId = req.user?.id || 'admin';
    
    serviceClient.resetCircuitBreaker(serviceName);
    
    // Log the action
    await presenceLogger.logUserPresence('circuit_breaker_reset', {
      userId,
      metadata: {
        service: serviceName,
        action: 'manual_reset'
      }
    });
    
    logger.info('Circuit breaker reset by admin', { serviceName, userId });
    
    res.json({
      success: true,
      message: `Circuit breaker reset for ${serviceName}`
    });
  })
);

// ============================================================================
// 🔧 SERVICE TESTING ENDPOINTS
// ============================================================================

/**
 * POST /api/orchestration/test/:serviceName
 * Test connectivity to a specific service
 */
router.post(
  '/test/:serviceName',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;
    const { path = '/health', method = 'GET' } = req.body;
    
    try {
      const result = await serviceClient.request(serviceName, {
        method: method as any,
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
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Service test failed: ${error.message}`,
        service: serviceName
      });
    }
  })
);

/**
 * POST /api/orchestration/test-all
 * Test connectivity to all services
 */
router.post(
  '/test-all',
  asyncHandler(async (req, res) => {
    const statuses = await serviceRegistry.getAllServiceStatuses();
    const services = Object.keys(statuses);
    
    const testResults = await Promise.allSettled(
      services.map(async (serviceName) => {
        try {
          const result = await serviceClient.get(serviceName, '/health');
          return {
            service: serviceName,
            success: result.success,
            responseTime: result.responseTime,
            status: result.statusCode
          };
        } catch (error) {
          return {
            service: serviceName,
            success: false,
            error: error.message,
            responseTime: 0,
            status: 0
          };
        }
      })
    );
    
    const results = testResults.map(result => 
      result.status === 'fulfilled' ? result.value : {
        service: 'unknown',
        success: false,
        error: result.reason.message
      }
    );
    
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
  })
);

// ============================================================================
// 📈 SERVICE ANALYTICS
// ============================================================================

/**
 * GET /api/orchestration/analytics
 * Get service analytics and metrics
 */
router.get(
  '/analytics',
  asyncHandler(async (req, res) => {
    const { timeframe = '24h' } = req.query;
    
    try {
      // Get analytics from presence logger
      const analytics = await presenceLogger.getAnalytics(timeframe as string);
      
      // Get current service statuses
      const serviceStatuses = await serviceRegistry.getAllServiceStatuses();
      
      // Get circuit breaker data
      const circuitBreakers = serviceClient.getCircuitBreakerStatus();
      
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
      
    } catch (error) {
      logger.error('Failed to get service analytics', { error });
      throw new AppError('Failed to get service analytics', 500, 'ANALYTICS_FAILED');
    }
  })
);

// ============================================================================
// 🚀 SERVICE MANAGEMENT
// ============================================================================

/**
 * POST /api/orchestration/services/:serviceName/wait
 * Wait for a service to become healthy
 */
router.post(
  '/services/:serviceName/wait',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;
    const { timeout = 60000 } = req.body;
    
    const startTime = Date.now();
    const isHealthy = await serviceRegistry.waitForService(serviceName, timeout);
    const waitTime = Date.now() - startTime;
    
    if (isHealthy) {
      res.json({
        success: true,
        message: `Service ${serviceName} is healthy`,
        waitTime
      });
    } else {
      res.status(408).json({
        success: false,
        error: `Timeout waiting for service ${serviceName}`,
        waitTime,
        timeout
      });
    }
  })
);

/**
 * POST /api/orchestration/dependencies/:serviceName/wait
 * Wait for all dependencies of a service to become healthy
 */
router.post(
  '/dependencies/:serviceName/wait',
  asyncHandler(async (req, res) => {
    const { serviceName } = req.params;
    const { timeout = 120000 } = req.body;
    
    const startTime = Date.now();
    const allHealthy = await serviceRegistry.waitForDependencies(serviceName, timeout);
    const waitTime = Date.now() - startTime;
    
    if (allHealthy) {
      res.json({
        success: true,
        message: `All dependencies for ${serviceName} are healthy`,
        waitTime
      });
    } else {
      res.status(408).json({
        success: false,
        error: `Timeout waiting for dependencies of ${serviceName}`,
        waitTime,
        timeout
      });
    }
  })
);

/**
 * GET /api/orchestration/topology
 * Get service dependency topology
 */
router.get(
  '/topology',
  asyncHandler(async (req, res) => {
    const topology = serviceRegistry.getServiceTopology();
    const statuses = await serviceRegistry.getAllServiceStatuses();
    
    // Create a visual representation of the topology
    const visualTopology = Object.entries(topology).map(([service, dependencies]) => ({
      service,
      dependencies,
      status: statuses[service]?.status || 'unknown',
      dependencyStatuses: dependencies.reduce((acc, dep) => {
        acc[dep] = statuses[dep]?.status || 'unknown';
        return acc;
      }, {} as Record<string, string>)
    }));
    
    res.json({
      success: true,
      data: {
        topology: visualTopology,
        graph: topology
      }
    });
  })
);

export { router as orchestrationRouter };