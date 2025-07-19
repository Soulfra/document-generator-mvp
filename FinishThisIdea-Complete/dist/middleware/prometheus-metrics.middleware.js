"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessMetricsMiddleware = businessMetricsMiddleware;
exports.apiKeyUsageMiddleware = apiKeyUsageMiddleware;
exports.userTierMiddleware = userTierMiddleware;
const prometheus_metrics_service_1 = require("../services/monitoring/prometheus-metrics.service");
const logger_1 = require("../utils/logger");
function businessMetricsMiddleware(req, res, next) {
    const originalJson = res.json;
    res.json = function (body) {
        try {
            recordBusinessMetrics(req, res, body);
        }
        catch (error) {
            logger_1.logger.error('Failed to record business metrics:', error);
        }
        return originalJson.call(this, body);
    };
    next();
}
function recordBusinessMetrics(req, res, responseBody) {
    const { method, path } = req;
    const statusCode = res.statusCode;
    const isSuccess = statusCode >= 200 && statusCode < 300;
    if (path.includes('/api-keys') && method === 'POST' && isSuccess) {
        const tier = responseBody?.data?.tier || 'FREE';
        prometheus_metrics_service_1.prometheusMetrics.recordApiKeyUsage('new', tier, 'create');
    }
    if (path.includes('/payment') && method === 'POST' && isSuccess) {
        const amount = responseBody?.data?.amount || 0;
        prometheus_metrics_service_1.prometheusMetrics.recordPayment('succeeded', amount);
    }
    if (path.includes('/ai') || path.includes('/llm') || path.includes('/chat')) {
        const provider = extractProvider(req, responseBody);
        const model = extractModel(req, responseBody);
        const status = isSuccess ? 'success' : 'error';
        prometheus_metrics_service_1.prometheusMetrics.recordAiRequest(provider, model, status);
    }
    if (path.includes('/qr') && method === 'POST' && isSuccess) {
        const type = path.includes('referral') ? 'referral' : 'general';
        prometheus_metrics_service_1.prometheusMetrics.recordQrCodeGenerated(type);
    }
    if (path.includes('/share') || path.includes('/social')) {
        const platform = extractSocialPlatform(req);
        const contentType = extractContentType(req);
        prometheus_metrics_service_1.prometheusMetrics.recordSocialShare(platform, contentType);
    }
    if (path.includes('/achievements') && method === 'POST' && isSuccess) {
        const achievementType = responseBody?.data?.type || 'unknown';
        const tier = responseBody?.data?.userTier || 'FREE';
        prometheus_metrics_service_1.prometheusMetrics.recordAchievementUnlocked(achievementType, tier);
    }
    if (path.includes('/upload') && method === 'POST' && isSuccess) {
        const fileType = extractFileType(req);
        prometheus_metrics_service_1.prometheusMetrics.recordUpload(fileType, 'processing');
    }
}
function extractProvider(req, responseBody) {
    if (req.body?.provider)
        return req.body.provider;
    if (responseBody?.data?.provider)
        return responseBody.data.provider;
    if (req.path.includes('anthropic'))
        return 'anthropic';
    if (req.path.includes('openai'))
        return 'openai';
    if (req.path.includes('ollama'))
        return 'ollama';
    return 'unknown';
}
function extractModel(req, responseBody) {
    if (req.body?.model)
        return req.body.model;
    if (responseBody?.data?.model)
        return responseBody.data.model;
    const provider = extractProvider(req, responseBody);
    switch (provider) {
        case 'anthropic': return 'claude-3';
        case 'openai': return 'gpt-4';
        case 'ollama': return 'llama2';
        default: return 'unknown';
    }
}
function extractSocialPlatform(req) {
    if (req.body?.platform)
        return req.body.platform;
    if (req.query?.platform)
        return req.query.platform;
    if (req.path.includes('twitter'))
        return 'twitter';
    if (req.path.includes('facebook'))
        return 'facebook';
    if (req.path.includes('linkedin'))
        return 'linkedin';
    return 'unknown';
}
function extractContentType(req) {
    if (req.body?.contentType)
        return req.body.contentType;
    if (req.path.includes('achievement'))
        return 'achievement';
    if (req.path.includes('job'))
        return 'job_completion';
    if (req.path.includes('referral'))
        return 'referral';
    return 'general';
}
function extractFileType(req) {
    if (req.file?.originalname) {
        const extension = req.file.originalname.split('.').pop();
        return extension?.toLowerCase() || 'unknown';
    }
    return 'unknown';
}
function apiKeyUsageMiddleware(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
        const tier = req.user?.tier || 'FREE';
        const endpoint = req.path;
        prometheus_metrics_service_1.prometheusMetrics.recordApiKeyUsage(apiKey.substring(0, 8), tier, endpoint);
    }
    next();
}
function userTierMiddleware(req, res, next) {
    const userTier = req.user?.tier || 'FREE';
    req.userTier = userTier;
    next();
}
//# sourceMappingURL=prometheus-metrics.middleware.js.map