/**
 * Status Page Routes
 * Public-facing system health API
 */

import { Router, Request, Response } from 'express';
import { statusPageService } from '../../services/status-page/status-page.service';
import { authentication } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { z } from 'zod';
import { logger } from '../../utils/logger';
import { mediumCache } from '../../middleware/cache.middleware';

const router = Router();

// Validation schemas
const incidentUpdateSchema = z.object({
  params: z.object({
    incidentId: z.string()
  }),
  body: z.object({
    status: z.enum(['investigating', 'identified', 'monitoring', 'resolved']).optional(),
    message: z.string(),
    author: z.string().optional()
  })
});

const maintenanceSchema = z.object({
  body: z.object({
    title: z.string(),
    description: z.string(),
    affectedServices: z.array(z.string()),
    scheduledFor: z.string().transform(str => new Date(str)),
    duration: z.number().min(1)
  })
});

/**
 * GET /api/status
 * Get current system status (public)
 */
router.get('/',
  mediumCache,
  async (req: Request, res: Response) => {
    try {
      const status = await statusPageService.getSystemStatus();
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Failed to get system status', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get system status'
      });
    }
  }
);

/**
 * GET /api/status/summary
 * Get simplified status summary (public)
 */
router.get('/summary',
  mediumCache,
  async (req: Request, res: Response) => {
    try {
      const status = await statusPageService.getSystemStatus();
      
      res.json({
        success: true,
        data: {
          status: status.overall,
          message: status.overall === 'operational' 
            ? 'All systems operational' 
            : `${status.activeIncidents.length} active incident(s)`,
          lastUpdated: status.lastUpdated
        }
      });
    } catch (error) {
      logger.error('Failed to get status summary', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get status summary'
      });
    }
  }
);

/**
 * GET /api/status/history
 * Get status history (public)
 */
router.get('/history',
  async (req: Request, res: Response) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const history = await statusPageService.getStatusHistory(hours);
      
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('Failed to get status history', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get status history'
      });
    }
  }
);

/**
 * POST /api/status/incidents
 * Create incident (admin only)
 */
router.post('/incidents',
  authentication({ role: 'admin' }),
  validate(z.object({
    body: z.object({
      service: z.string(),
      severity: z.enum(['minor', 'major', 'critical']),
      title: z.string(),
      description: z.string()
    })
  })),
  async (req: Request, res: Response) => {
    try {
      const incident = await statusPageService.createIncident(req.body);
      
      res.json({
        success: true,
        data: incident
      });
    } catch (error) {
      logger.error('Failed to create incident', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create incident'
      });
    }
  }
);

/**
 * PUT /api/status/incidents/:incidentId
 * Update incident (admin only)
 */
router.put('/incidents/:incidentId',
  authentication({ role: 'admin' }),
  validate(incidentUpdateSchema),
  async (req: Request, res: Response) => {
    try {
      const { incidentId } = req.params;
      await statusPageService.updateIncident(incidentId, req.body);
      
      res.json({
        success: true,
        message: 'Incident updated successfully'
      });
    } catch (error) {
      logger.error('Failed to update incident', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update incident'
      });
    }
  }
);

/**
 * POST /api/status/maintenance
 * Schedule maintenance (admin only)
 */
router.post('/maintenance',
  authentication({ role: 'admin' }),
  validate(maintenanceSchema),
  async (req: Request, res: Response) => {
    try {
      const maintenance = await statusPageService.scheduleMaintenance(req.body);
      
      res.json({
        success: true,
        data: maintenance
      });
    } catch (error) {
      logger.error('Failed to schedule maintenance', error);
      res.status(500).json({
        success: false,
        error: 'Failed to schedule maintenance'
      });
    }
  }
);

/**
 * GET /api/status/services
 * Get individual service statuses (public)
 */
router.get('/services',
  mediumCache,
  async (req: Request, res: Response) => {
    try {
      const status = await statusPageService.getSystemStatus();
      
      res.json({
        success: true,
        data: status.services
      });
    } catch (error) {
      logger.error('Failed to get service statuses', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get service statuses'
      });
    }
  }
);

/**
 * GET /api/status/incidents
 * Get all incidents (public)
 */
router.get('/incidents',
  mediumCache,
  async (req: Request, res: Response) => {
    try {
      const status = await statusPageService.getSystemStatus();
      
      res.json({
        success: true,
        data: {
          active: status.activeIncidents,
          recent: status.recentIncidents
        }
      });
    } catch (error) {
      logger.error('Failed to get incidents', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get incidents'
      });
    }
  }
);

/**
 * GET /api/status/metrics
 * Get system metrics (public)
 */
router.get('/metrics',
  mediumCache,
  async (req: Request, res: Response) => {
    try {
      const status = await statusPageService.getSystemStatus();
      
      res.json({
        success: true,
        data: status.metrics
      });
    } catch (error) {
      logger.error('Failed to get system metrics', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get system metrics'
      });
    }
  }
);

/**
 * POST /api/status/subscribe
 * Subscribe to status updates (public)
 */
router.post('/subscribe',
  validate(z.object({
    body: z.object({
      email: z.string().email(),
      services: z.array(z.string()).optional()
    })
  })),
  async (req: Request, res: Response) => {
    try {
      // In a real implementation, this would add email to notification list
      logger.info('Status page subscription', { email: req.body.email });
      
      res.json({
        success: true,
        message: 'Successfully subscribed to status updates'
      });
    } catch (error) {
      logger.error('Failed to subscribe to status updates', error);
      res.status(500).json({
        success: false,
        error: 'Failed to subscribe'
      });
    }
  }
);

export const statusRouter = router;