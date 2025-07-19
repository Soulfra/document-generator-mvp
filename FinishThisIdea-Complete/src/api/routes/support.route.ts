/**
 * Support/Help Desk Routes
 * Customer support ticket management
 */

import { Router, Request, Response } from 'express';
import { intercomService } from '../../services/helpdesk/intercom.service';
import { authentication } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { z } from 'zod';
import { logger } from '../../utils/logger';

const router = Router();

// Validation schemas
const createTicketSchema = z.object({
  body: z.object({
    subject: z.string().min(5).max(200),
    description: z.string().min(10).max(5000),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    category: z.string().min(2).max(50),
    attachments: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional()
  })
});

const updateTicketSchema = z.object({
  params: z.object({
    ticketId: z.string()
  }),
  body: z.object({
    status: z.enum(['open', 'pending', 'resolved', 'closed']).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    note: z.string().optional(),
    tags: z.array(z.string()).optional()
  })
});

const addNoteSchema = z.object({
  params: z.object({
    ticketId: z.string()
  }),
  body: z.object({
    note: z.string().min(1).max(2000),
    isPublic: z.boolean().default(false)
  })
});

/**
 * POST /api/support/tickets
 * Create new support ticket
 */
router.post('/tickets',
  authentication(),
  validate(createTicketSchema),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      const ticketData = {
        userId: user.id,
        email: user.email,
        ...req.body,
        status: 'open' as const,
        createdAt: new Date()
      };

      // Create user in Intercom if not exists
      await intercomService.createOrUpdateUser({
        user_id: user.id,
        email: user.email,
        name: user.name || user.displayName,
        custom_attributes: {
          tier: user.tier,
          createdAt: user.createdAt
        }
      });

      // Create ticket
      const ticketId = await intercomService.createTicket(ticketData);
      
      if (!ticketId) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create support ticket'
        });
      }

      res.json({
        success: true,
        data: {
          ticketId,
          status: 'created',
          message: 'Support ticket created successfully'
        }
      });
    } catch (error) {
      logger.error('Failed to create support ticket', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create support ticket'
      });
    }
  }
);

/**
 * GET /api/support/tickets
 * Get user's tickets
 */
router.get('/tickets',
  authentication(),
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tickets = await intercomService.getUserTickets(user.email);
      
      res.json({
        success: true,
        data: tickets
      });
    } catch (error) {
      logger.error('Failed to get user tickets', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get tickets'
      });
    }
  }
);

/**
 * GET /api/support/tickets/:ticketId
 * Get specific ticket
 */
router.get('/tickets/:ticketId',
  authentication(),
  async (req: Request, res: Response) => {
    try {
      const { ticketId } = req.params;
      const ticket = await intercomService.getTicket(ticketId);
      
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found'
        });
      }

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      logger.error('Failed to get ticket', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get ticket'
      });
    }
  }
);

/**
 * PUT /api/support/tickets/:ticketId
 * Update ticket (admin only)
 */
router.put('/tickets/:ticketId',
  authentication({ role: 'admin' }),
  validate(updateTicketSchema),
  async (req: Request, res: Response) => {
    try {
      const { ticketId } = req.params;
      const success = await intercomService.updateTicket(ticketId, req.body);
      
      if (!success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update ticket'
        });
      }

      res.json({
        success: true,
        message: 'Ticket updated successfully'
      });
    } catch (error) {
      logger.error('Failed to update ticket', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update ticket'
      });
    }
  }
);

/**
 * POST /api/support/tickets/:ticketId/notes
 * Add note to ticket
 */
router.post('/tickets/:ticketId/notes',
  authentication({ role: 'admin' }),
  validate(addNoteSchema),
  async (req: Request, res: Response) => {
    try {
      const { ticketId } = req.params;
      const { note, isPublic } = req.body;
      
      const success = await intercomService.addNote(ticketId, note, isPublic);
      
      if (!success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to add note'
        });
      }

      res.json({
        success: true,
        message: 'Note added successfully'
      });
    } catch (error) {
      logger.error('Failed to add note to ticket', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add note'
      });
    }
  }
);

/**
 * GET /api/support/widget-settings
 * Get Intercom widget settings for frontend
 */
router.get('/widget-settings',
  async (req: Request, res: Response) => {
    try {
      const settings = intercomService.getWidgetSettings();
      
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      logger.error('Failed to get widget settings', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get widget settings'
      });
    }
  }
);

/**
 * GET /api/support/status
 * Get help desk service status
 */
router.get('/status',
  authentication({ role: 'admin' }),
  async (req: Request, res: Response) => {
    try {
      const status = intercomService.getStatus();
      const isConnected = await intercomService.testConnection();
      
      res.json({
        success: true,
        data: {
          ...status,
          connected: isConnected
        }
      });
    } catch (error) {
      logger.error('Failed to get support status', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get status'
      });
    }
  }
);

/**
 * POST /api/support/test-connection
 * Test Intercom connection (admin only)
 */
router.post('/test-connection',
  authentication({ role: 'admin' }),
  async (req: Request, res: Response) => {
    try {
      const isConnected = await intercomService.testConnection();
      
      res.json({
        success: true,
        data: {
          connected: isConnected,
          message: isConnected 
            ? 'Intercom connection successful' 
            : 'Intercom connection failed'
        }
      });
    } catch (error) {
      logger.error('Failed to test Intercom connection', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test connection'
      });
    }
  }
);

/**
 * POST /api/support/contact
 * Public contact form (no auth required)
 */
router.post('/contact',
  validate(z.object({
    body: z.object({
      name: z.string().min(2).max(100),
      email: z.string().email(),
      subject: z.string().min(5).max(200),
      message: z.string().min(10).max(2000),
      category: z.string().default('general')
    })
  })),
  async (req: Request, res: Response) => {
    try {
      const { name, email, subject, message, category } = req.body;
      
      // Create anonymous user
      await intercomService.createOrUpdateUser({
        email,
        name,
        custom_attributes: {
          source: 'contact_form'
        }
      });

      // Create ticket
      const ticketId = await intercomService.createTicket({
        userId: 'anonymous',
        email,
        subject,
        description: message,
        priority: 'normal',
        category,
        status: 'open',
        createdAt: new Date(),
        metadata: {
          source: 'contact_form',
          name
        }
      });

      res.json({
        success: true,
        data: {
          ticketId,
          message: 'Contact form submitted successfully'
        }
      });
    } catch (error) {
      logger.error('Failed to process contact form', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit contact form'
      });
    }
  }
);

export const supportRouter = router;