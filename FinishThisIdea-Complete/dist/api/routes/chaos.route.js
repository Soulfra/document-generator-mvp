"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chaosRouter = void 0;
const express_1 = require("express");
const chaos_engineering_service_1 = require("../../services/chaos/chaos-engineering.service");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const zod_1 = require("zod");
const logger_1 = require("../../utils/logger");
const router = (0, express_1.Router)();
const experimentIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        experimentId: zod_1.z.string()
    })
});
const createExperimentSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string(),
        description: zod_1.z.string(),
        type: zod_1.z.enum(['latency', 'error', 'resource', 'network', 'database']),
        target: zod_1.z.string().optional(),
        probability: zod_1.z.number().min(0).max(1),
        duration: zod_1.z.number().optional(),
        config: zod_1.z.any().optional(),
        enabled: zod_1.z.boolean().default(false),
        tags: zod_1.z.array(zod_1.z.string()).optional()
    })
});
const chaosGuard = (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
            success: false,
            error: 'Chaos engineering is disabled in production'
        });
    }
    next();
};
router.get('/experiments', (0, auth_middleware_1.authentication)({ role: 'admin' }), chaosGuard, async (req, res) => {
    try {
        const experiments = chaos_engineering_service_1.chaosEngineering.getExperiments();
        res.json({
            success: true,
            data: experiments
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to list chaos experiments', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list experiments'
        });
    }
});
router.post('/experiments', (0, auth_middleware_1.authentication)({ role: 'admin' }), chaosGuard, (0, validation_middleware_1.validate)(createExperimentSchema), async (req, res) => {
    try {
        const experiment = {
            id: `chaos-${Date.now()}`,
            ...req.body
        };
        chaos_engineering_service_1.chaosEngineering.createExperiment(experiment);
        res.json({
            success: true,
            data: experiment
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create chaos experiment', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create experiment'
        });
    }
});
router.post('/experiments/:experimentId/enable', (0, auth_middleware_1.authentication)({ role: 'admin' }), chaosGuard, (0, validation_middleware_1.validate)(experimentIdSchema), async (req, res) => {
    try {
        const { experimentId } = req.params;
        chaos_engineering_service_1.chaosEngineering.enableExperiment(experimentId);
        res.json({
            success: true,
            message: `Experiment ${experimentId} enabled`
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to enable chaos experiment', error);
        res.status(500).json({
            success: false,
            error: 'Failed to enable experiment'
        });
    }
});
router.post('/experiments/:experimentId/disable', (0, auth_middleware_1.authentication)({ role: 'admin' }), chaosGuard, (0, validation_middleware_1.validate)(experimentIdSchema), async (req, res) => {
    try {
        const { experimentId } = req.params;
        chaos_engineering_service_1.chaosEngineering.disableExperiment(experimentId);
        res.json({
            success: true,
            message: `Experiment ${experimentId} disabled`
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to disable chaos experiment', error);
        res.status(500).json({
            success: false,
            error: 'Failed to disable experiment'
        });
    }
});
router.get('/experiments/:experimentId/results', (0, auth_middleware_1.authentication)({ role: 'admin' }), chaosGuard, (0, validation_middleware_1.validate)(experimentIdSchema), async (req, res) => {
    try {
        const { experimentId } = req.params;
        const limit = parseInt(req.query.limit) || 100;
        const results = await chaos_engineering_service_1.chaosEngineering.getExperimentResults(experimentId, limit);
        res.json({
            success: true,
            data: results
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get experiment results', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get results'
        });
    }
});
router.get('/circuit-breakers', (0, auth_middleware_1.authentication)({ role: 'admin' }), async (req, res) => {
    try {
        const services = ['database', 'redis', 'stripe', 'ai-service'];
        const states = {};
        services.forEach(service => {
            const breaker = chaos_engineering_service_1.chaosEngineering.getCircuitBreaker(service);
            states[service] = breaker.getState();
        });
        res.json({
            success: true,
            data: states
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get circuit breaker states', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get circuit breaker states'
        });
    }
});
router.post('/circuit-breakers/:service/reset', (0, auth_middleware_1.authentication)({ role: 'admin' }), async (req, res) => {
    try {
        const { service } = req.params;
        const breaker = chaos_engineering_service_1.chaosEngineering.getCircuitBreaker(service);
        breaker.reset();
        res.json({
            success: true,
            message: `Circuit breaker for ${service} reset`
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to reset circuit breaker', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reset circuit breaker'
        });
    }
});
router.get('/status', (0, auth_middleware_1.authentication)({ role: 'admin' }), async (req, res) => {
    try {
        const experiments = chaos_engineering_service_1.chaosEngineering.getExperiments();
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
    }
    catch (error) {
        logger_1.logger.error('Failed to get chaos status', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get status'
        });
    }
});
exports.chaosRouter = router;
//# sourceMappingURL=chaos.route.js.map