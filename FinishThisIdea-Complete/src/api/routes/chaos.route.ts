/**
 * Chaos Engineering Routes
 * Controlled failure injection for resilience testing
 */

import { Router, Request, Response } from 'express';
import { chaosEngineering } from '../../services/chaos/chaos-engineering.service';
import { authentication } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { z } from 'zod';
import { logger } from '../../utils/logger';

const router = Router();

// Validation schemas
const experimentIdSchema = z.object({
  params: z.object({
    experimentId: z.string()
  })
});

const createExperimentSchema = z.object({
  body: z.object({
    name: z.string(),
    description: z.string(),
    type: z.enum(['latency', 'error', 'resource', 'network', 'database']),
    target: z.string().optional(),
    probability: z.number().min(0).max(1),
    duration: z.number().optional(),
    config: z.any().optional(),
    enabled: z.boolean().default(false),
    tags: z.array(z.string()).optional()
  })
});

// Middleware to ensure chaos engineering is only accessible in non-production
const chaosGuard = (req: Request, res: Response, next: Function) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Chaos engineering is disabled in production'
    });
  }
  next();
};

/**
 * GET /api/chaos/experiments
 * List all chaos experiments
 */
router.get('/experiments', 
  authentication({ role: 'admin' }), 
  chaosGuard,
  async (req: Request, res: Response) => {
    try {
      const experiments = chaosEngineering.getExperiments();
      
      res.json({
        success: true,
        data: experiments
      });
    } catch (error) {
      logger.error('Failed to list chaos experiments', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list experiments'
      });
    }
  }
);

/**
 * POST /api/chaos/experiments
 * Create new chaos experiment
 */
router.post('/experiments',
  authentication({ role: 'admin' }),
  chaosGuard,
  validate(createExperimentSchema),
  async (req: Request, res: Response) => {
    try {
      const experiment = {
        id: `chaos-${Date.now()}`,
        ...req.body
      };
      
      chaosEngineering.createExperiment(experiment);
      
      res.json({
        success: true,
        data: experiment
      });
    } catch (error) {
      logger.error('Failed to create chaos experiment', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create experiment'
      });
    }
  }
);

/**
 * POST /api/chaos/experiments/:experimentId/enable
 * Enable a chaos experiment
 */
router.post('/experiments/:experimentId/enable',
  authentication({ role: 'admin' }),
  chaosGuard,
  validate(experimentIdSchema),
  async (req: Request, res: Response) => {
    try {
      const { experimentId } = req.params;
      
      chaosEngineering.enableExperiment(experimentId);
      
      res.json({
        success: true,
        message: `Experiment ${experimentId} enabled`
      });
    } catch (error) {
      logger.error('Failed to enable chaos experiment', error);
      res.status(500).json({
        success: false,
        error: 'Failed to enable experiment'
      });
    }
  }
);

/**
 * POST /api/chaos/experiments/:experimentId/disable
 * Disable a chaos experiment
 */
router.post('/experiments/:experimentId/disable',
  authentication({ role: 'admin' }),
  chaosGuard,
  validate(experimentIdSchema),
  async (req: Request, res: Response) => {
    try {
      const { experimentId } = req.params;
      
      chaosEngineering.disableExperiment(experimentId);
      
      res.json({
        success: true,
        message: `Experiment ${experimentId} disabled`
      });
    } catch (error) {
      logger.error('Failed to disable chaos experiment', error);
      res.status(500).json({
        success: false,
        error: 'Failed to disable experiment'
      });
    }
  }
);

/**
 * GET /api/chaos/experiments/:experimentId/results
 * Get experiment results
 */
router.get('/experiments/:experimentId/results',
  authentication({ role: 'admin' }),
  chaosGuard,
  validate(experimentIdSchema),
  async (req: Request, res: Response) => {
    try {
      const { experimentId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const results = await chaosEngineering.getExperimentResults(experimentId, limit);
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('Failed to get experiment results', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get results'
      });
    }
  }
);

/**
 * GET /api/chaos/circuit-breakers
 * Get circuit breaker states
 */
router.get('/circuit-breakers',
  authentication({ role: 'admin' }),
  async (req: Request, res: Response) => {
    try {
      // Get circuit breaker states for common services
      const services = ['database', 'redis', 'stripe', 'ai-service'];
      const states: any = {};
      
      services.forEach(service => {
        const breaker = chaosEngineering.getCircuitBreaker(service);
        states[service] = breaker.getState();
      });
      
      res.json({
        success: true,
        data: states
      });
    } catch (error) {
      logger.error('Failed to get circuit breaker states', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get circuit breaker states'
      });
    }
  }
);

/**
 * POST /api/chaos/circuit-breakers/:service/reset
 * Reset circuit breaker for a service
 */
router.post('/circuit-breakers/:service/reset',
  authentication({ role: 'admin' }),
  async (req: Request, res: Response) => {
    try {
      const { service } = req.params;
      
      const breaker = chaosEngineering.getCircuitBreaker(service);
      breaker.reset();
      
      res.json({
        success: true,
        message: `Circuit breaker for ${service} reset`
      });
    } catch (error) {
      logger.error('Failed to reset circuit breaker', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset circuit breaker'
      });
    }
  }
);

/**
 * GET /api/chaos/status
 * Get chaos engineering status
 */
router.get('/status',
  authentication({ role: 'admin' }),
  async (req: Request, res: Response) => {
    try {
      const experiments = chaosEngineering.getExperiments();
      const enabledCount = experiments.filter(e => e.enabled).length;
      
      res.json({
        success: true,
        data: {
          enabled: process.env.CHAOS_ENGINEERING_ENABLED === 'true',
          environment: process.env.NODE_ENV,
          totalExperiments: experiments.length,
          activeExperiments: enabledCount,
          experiments: experiments.map(e => ({
            id: e.id,
            name: e.name,
            type: e.type,
            enabled: e.enabled
          }))
        }
      });
    } catch (error) {
      logger.error('Failed to get chaos status', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get status'
      });
    }
  }
);

export const chaosRouter = router;