"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalSignature = exports.requireSignature = void 0;
exports.createRequestSigningMiddleware = createRequestSigningMiddleware;
exports.signWebhookRequest = signWebhookRequest;
exports.RequireSignature = RequireSignature;
exports.validateWebhookSignature = validateWebhookSignature;
const hmac_service_1 = require("../services/crypto/hmac.service");
const api_key_service_1 = require("../services/api-keys/api-key.service");
const secrets_manager_service_1 = require("../services/secrets/secrets-manager.service");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const prometheus_metrics_service_1 = require("../services/monitoring/prometheus-metrics.service");
const defaultOptions = {
    required: true,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    skipPaths: ['/health', '/api/health', '/api/auth/login', '/api/auth/register'],
    allowUnsigned: false
};
function createRequestSigningMiddleware(options = {}) {
    const config = { ...defaultOptions, ...options };
    return async (req, res, next) => {
        const start = Date.now();
        try {
            if (config.skipPaths?.includes(req.path)) {
                return next();
            }
            if (config.methods && !config.methods.includes(req.method)) {
                return next();
            }
            if (config.endpoints && !config.endpoints.some(ep => req.path.startsWith(ep))) {
                return next();
            }
            const signature = req.headers['x-signature'];
            const apiKey = req.headers['x-api-key'];
            if (!signature || !apiKey) {
                if (config.allowUnsigned) {
                    return next();
                }
                prometheus_metrics_service_1.prometheusMetrics.authAttempts.inc({ status: 'missing_signature' });
                throw new errors_1.AppError('Request signature required', 401);
            }
            const keyValidation = await api_key_service_1.apiKeyService.validateApiKey(apiKey);
            if (!keyValidation.valid) {
                prometheus_metrics_service_1.prometheusMetrics.authAttempts.inc({ status: 'invalid_api_key' });
                throw new errors_1.AppError('Invalid API key', 401);
            }
            const apiKeyId = keyValidation.apiKey.id;
            const secretData = await secrets_manager_service_1.secretsManager.getSecret(`apikey:${apiKeyId}`);
            if (!secretData) {
                logger_1.logger.error('API secret not found', { apiKeyId });
                throw new errors_1.AppError('Invalid API configuration', 500);
            }
            const verification = await hmac_service_1.hmacService.verifyRequest(req, secretData.value);
            if (!verification.valid) {
                prometheus_metrics_service_1.prometheusMetrics.authAttempts.inc({ status: 'invalid_signature' });
                logger_1.logger.warn('Invalid request signature', {
                    apiKeyId,
                    reason: verification.reason,
                    path: req.path,
                    method: req.method
                });
                throw new errors_1.AppError(`Invalid request signature: ${verification.reason}`, 401);
            }
            const rateLimit = await api_key_service_1.apiKeyService.checkRateLimit(apiKeyId, keyValidation.apiKey.rateLimit);
            if (!rateLimit.allowed) {
                prometheus_metrics_service_1.prometheusMetrics.rateLimitHits.inc({ key: apiKeyId });
                res.setHeader('X-RateLimit-Limit', keyValidation.apiKey.rateLimit.requests);
                res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
                res.setHeader('X-RateLimit-Reset', rateLimit.resetAt.toISOString());
                throw new errors_1.AppError('Rate limit exceeded', 429);
            }
            if (keyValidation.apiKey.rateLimit) {
                res.setHeader('X-RateLimit-Limit', keyValidation.apiKey.rateLimit.requests);
                res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
                res.setHeader('X-RateLimit-Reset', rateLimit.resetAt.toISOString());
            }
            req.apiKey = keyValidation.apiKey;
            req.user = keyValidation.user;
            req.signatureVerified = true;
            prometheus_metrics_service_1.prometheusMetrics.authAttempts.inc({ status: 'success' });
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'request_signing_validation' }, Date.now() - start);
            next();
        }
        catch (error) {
            if (error instanceof errors_1.AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    error: error.message
                });
            }
            else {
                logger_1.logger.error('Request signing middleware error', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error'
                });
            }
        }
    };
}
exports.requireSignature = createRequestSigningMiddleware({
    required: true,
    allowUnsigned: false
});
exports.optionalSignature = createRequestSigningMiddleware({
    required: false,
    allowUnsigned: true
});
async function signWebhookRequest(url, payload, webhookSecret) {
    const { signature, timestamp, header } = cryptoService.generateWebhookSignature(payload, webhookSecret);
    return {
        headers: {
            'X-Webhook-Signature': header,
            'X-Webhook-Timestamp': timestamp.toString(),
            'Content-Type': 'application/json'
        },
        signature
    };
}
function RequireSignature(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (req, res, next) {
        if (!req.signatureVerified) {
            return res.status(401).json({
                success: false,
                error: 'Request signature required'
            });
        }
        return originalMethod.call(this, req, res, next);
    };
    return descriptor;
}
function validateWebhookSignature(secretKey) {
    return (req, res, next) => {
        try {
            const signatureHeader = req.headers['x-webhook-signature'];
            if (!signatureHeader) {
                throw new errors_1.AppError('Missing webhook signature', 401);
            }
            const secret = process.env[secretKey] || '';
            if (!secret) {
                logger_1.logger.error('Webhook secret not configured', { secretKey });
                throw new errors_1.AppError('Webhook configuration error', 500);
            }
            const isValid = cryptoService.verifyWebhookSignature(req.body, signatureHeader, secret, 300);
            if (!isValid) {
                prometheus_metrics_service_1.prometheusMetrics.webhookValidationFailures.inc({ webhook: secretKey });
                throw new errors_1.AppError('Invalid webhook signature', 401);
            }
            prometheus_metrics_service_1.prometheusMetrics.webhookValidationSuccess.inc({ webhook: secretKey });
            next();
        }
        catch (error) {
            if (error instanceof errors_1.AppError) {
                res.status(error.statusCode).json({
                    success: false,
                    error: error.message
                });
            }
            else {
                logger_1.logger.error('Webhook validation error', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error'
                });
            }
        }
    };
}
//# sourceMappingURL=request-signing.middleware.js.map