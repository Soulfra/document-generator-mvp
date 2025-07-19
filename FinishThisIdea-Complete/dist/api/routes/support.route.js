"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportRouter = void 0;
const express_1 = require("express");
const intercom_service_1 = require("../../services/helpdesk/intercom.service");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const zod_1 = require("zod");
const logger_1 = require("../../utils/logger");
const router = (0, express_1.Router)();
const createTicketSchema = zod_1.z.object({
    body: zod_1.z.object({
        subject: zod_1.z.string().min(5).max(200),
        description: zod_1.z.string().min(10).max(5000),
        priority: zod_1.z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
        category: zod_1.z.string().min(2).max(50),
        attachments: zod_1.z.array(zod_1.z.string()).optional(),
        metadata: zod_1.z.record(zod_1.z.any()).optional()
    })
});
const updateTicketSchema = zod_1.z.object({
    params: zod_1.z.object({
        ticketId: zod_1.z.string()
    }),
    body: zod_1.z.object({
        status: zod_1.z.enum(['open', 'pending', 'resolved', 'closed']).optional(),
        priority: zod_1.z.enum(['low', 'normal', 'high', 'urgent']).optional(),
        note: zod_1.z.string().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional()
    })
});
const addNoteSchema = zod_1.z.object({
    params: zod_1.z.object({
        ticketId: zod_1.z.string()
    }),
    body: zod_1.z.object({
        note: zod_1.z.string().min(1).max(2000),
        isPublic: zod_1.z.boolean().default(false)
    })
});
router.post('/tickets', (0, auth_middleware_1.authentication)(), (0, validation_middleware_1.validate)(createTicketSchema), async (req, res) => {
    try {
        const user = req.user;
        const ticketData = {
            userId: user.id,
            email: user.email,
            ...req.body,
            status: 'open',
            createdAt: new Date()
        };
        await intercom_service_1.intercomService.createOrUpdateUser({
            user_id: user.id,
            email: user.email,
            name: user.name || user.displayName,
            custom_attributes: {
                tier: user.tier,
                createdAt: user.createdAt
            }
        });
        const ticketId = await intercom_service_1.intercomService.createTicket(ticketData);
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
    }
    catch (error) {
        logger_1.logger.error('Failed to create support ticket', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create support ticket'
        });
    }
});
router.get('/tickets', (0, auth_middleware_1.authentication)(), async (req, res) => {
    try {
        const user = req.user;
        const tickets = await intercom_service_1.intercomService.getUserTickets(user.email);
        res.json({
            success: true,
            data: tickets
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get user tickets', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get tickets'
        });
    }
});
router.get('/tickets/:ticketId', (0, auth_middleware_1.authentication)(), async (req, res) => {
    try {
        const { ticketId } = req.params;
        const ticket = await intercom_service_1.intercomService.getTicket(ticketId);
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
    }
    catch (error) {
        logger_1.logger.error('Failed to get ticket', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get ticket'
        });
    }
});
router.put('/tickets/:ticketId', (0, auth_middleware_1.authentication)({ role: 'admin' }), (0, validation_middleware_1.validate)(updateTicketSchema), async (req, res) => {
    try {
        const { ticketId } = req.params;
        const success = await intercom_service_1.intercomService.updateTicket(ticketId, req.body);
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
    }
    catch (error) {
        logger_1.logger.error('Failed to update ticket', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update ticket'
        });
    }
});
router.post('/tickets/:ticketId/notes', (0, auth_middleware_1.authentication)({ role: 'admin' }), (0, validation_middleware_1.validate)(addNoteSchema), async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { note, isPublic } = req.body;
        const success = await intercom_service_1.intercomService.addNote(ticketId, note, isPublic);
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
    }
    catch (error) {
        logger_1.logger.error('Failed to add note to ticket', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add note'
        });
    }
});
router.get('/widget-settings', async (req, res) => {
    try {
        const settings = intercom_service_1.intercomService.getWidgetSettings();
        res.json({
            success: true,
            data: settings
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get widget settings', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get widget settings'
        });
    }
});
router.get('/status', (0, auth_middleware_1.authentication)({ role: 'admin' }), async (req, res) => {
    try {
        const status = intercom_service_1.intercomService.getStatus();
        const isConnected = await intercom_service_1.intercomService.testConnection();
        res.json({
            success: true,
            data: {
                ...status,
                connected: isConnected
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get support status', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get status'
        });
    }
});
router.post('/test-connection', (0, auth_middleware_1.authentication)({ role: 'admin' }), async (req, res) => {
    try {
        const isConnected = await intercom_service_1.intercomService.testConnection();
        res.json({
            success: true,
            data: {
                connected: isConnected,
                message: isConnected
                    ? 'Intercom connection successful'
                    : 'Intercom connection failed'
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to test Intercom connection', error);
        res.status(500).json({
            success: false,
            error: 'Failed to test connection'
        });
    }
});
router.post('/contact', (0, validation_middleware_1.validate)(zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).max(100),
        email: zod_1.z.string().email(),
        subject: zod_1.z.string().min(5).max(200),
        message: zod_1.z.string().min(10).max(2000),
        category: zod_1.z.string().default('general')
    })
})), async (req, res) => {
    try {
        const { name, email, subject, message, category } = req.body;
        await intercom_service_1.intercomService.createOrUpdateUser({
            email,
            name,
            custom_attributes: {
                source: 'contact_form'
            }
        });
        const ticketId = await intercom_service_1.intercomService.createTicket({
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
    }
    catch (error) {
        logger_1.logger.error('Failed to process contact form', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit contact form'
        });
    }
});
exports.supportRouter = router;
//# sourceMappingURL=support.route.js.map