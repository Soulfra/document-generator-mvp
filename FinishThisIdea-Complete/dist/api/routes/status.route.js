"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusRouter = void 0;
const express_1 = require("express");
const status_page_service_1 = require("../../services/status-page/status-page.service");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const zod_1 = require("zod");
const logger_1 = require("../../utils/logger");
const cache_middleware_1 = require("../../middleware/cache.middleware");
const router = (0, express_1.Router)();
const incidentUpdateSchema = zod_1.z.object({
    params: zod_1.z.object({
        incidentId: zod_1.z.string()
    }),
    body: zod_1.z.object({
        status: zod_1.z.enum(['investigating', 'identified', 'monitoring', 'resolved']).optional(),
        message: zod_1.z.string(),
        author: zod_1.z.string().optional()
    })
});
const maintenanceSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string(),
        description: zod_1.z.string(),
        affectedServices: zod_1.z.array(zod_1.z.string()),
        scheduledFor: zod_1.z.string().transform(str => new Date(str)),
        duration: zod_1.z.number().min(1)
    })
});
router.get('/', cache_middleware_1.mediumCache, async (req, res) => {
    try {
        const status = await status_page_service_1.statusPageService.getSystemStatus();
        res.json({
            success: true,
            data: status
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get system status', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get system status'
        });
    }
});
router.get('/summary', cache_middleware_1.mediumCache, async (req, res) => {
    try {
        const status = await status_page_service_1.statusPageService.getSystemStatus();
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
    }
    catch (error) {
        logger_1.logger.error('Failed to get status summary', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get status summary'
        });
    }
});
router.get('/history', async (req, res) => {
    try {
        const hours = parseInt(req.query.hours) || 24;
        const history = await status_page_service_1.statusPageService.getStatusHistory(hours);
        res.json({
            success: true,
            data: history
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get status history', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get status history'
        });
    }
});
router.post('/incidents', (0, auth_middleware_1.authentication)({ role: 'admin' }), (0, validation_middleware_1.validate)(zod_1.z.object({
    body: zod_1.z.object({
        service: zod_1.z.string(),
        severity: zod_1.z.enum(['minor', 'major', 'critical']),
        title: zod_1.z.string(),
        description: zod_1.z.string()
    })
})), async (req, res) => {
    try {
        const incident = await status_page_service_1.statusPageService.createIncident(req.body);
        res.json({
            success: true,
            data: incident
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create incident', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create incident'
        });
    }
});
router.put('/incidents/:incidentId', (0, auth_middleware_1.authentication)({ role: 'admin' }), (0, validation_middleware_1.validate)(incidentUpdateSchema), async (req, res) => {
    try {
        const { incidentId } = req.params;
        await status_page_service_1.statusPageService.updateIncident(incidentId, req.body);
        res.json({
            success: true,
            message: 'Incident updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to update incident', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update incident'
        });
    }
});
router.post('/maintenance', (0, auth_middleware_1.authentication)({ role: 'admin' }), (0, validation_middleware_1.validate)(maintenanceSchema), async (req, res) => {
    try {
        const maintenance = await status_page_service_1.statusPageService.scheduleMaintenance(req.body);
        res.json({
            success: true,
            data: maintenance
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to schedule maintenance', error);
        res.status(500).json({
            success: false,
            error: 'Failed to schedule maintenance'
        });
    }
});
router.get('/services', cache_middleware_1.mediumCache, async (req, res) => {
    try {
        const status = await status_page_service_1.statusPageService.getSystemStatus();
        res.json({
            success: true,
            data: status.services
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get service statuses', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get service statuses'
        });
    }
});
router.get('/incidents', cache_middleware_1.mediumCache, async (req, res) => {
    try {
        const status = await status_page_service_1.statusPageService.getSystemStatus();
        res.json({
            success: true,
            data: {
                active: status.activeIncidents,
                recent: status.recentIncidents
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get incidents', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get incidents'
        });
    }
});
router.get('/metrics', cache_middleware_1.mediumCache, async (req, res) => {
    try {
        const status = await status_page_service_1.statusPageService.getSystemStatus();
        res.json({
            success: true,
            data: status.metrics
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get system metrics', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get system metrics'
        });
    }
});
router.post('/subscribe', (0, validation_middleware_1.validate)(zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        services: zod_1.z.array(zod_1.z.string()).optional()
    })
})), async (req, res) => {
    try {
        logger_1.logger.info('Status page subscription', { email: req.body.email });
        res.json({
            success: true,
            message: 'Successfully subscribed to status updates'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to subscribe to status updates', error);
        res.status(500).json({
            success: false,
            error: 'Failed to subscribe'
        });
    }
});
exports.statusRouter = router;
//# sourceMappingURL=status.route.js.map