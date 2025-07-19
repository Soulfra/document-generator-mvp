"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gdprService = exports.GDPRComplianceService = void 0;
const database_1 = require("../../utils/database");
const redis_1 = require("../../config/redis");
const logger_1 = require("../../utils/logger");
const prometheus_metrics_service_1 = require("../monitoring/prometheus-metrics.service");
const crypto_1 = __importDefault(require("crypto"));
const defaultConfig = {
    consentVersion: '1.0',
    dataRetentionDays: 365 * 2,
    anonymizationDelayDays: 30,
    exportExpirationDays: 7,
    enableConsentBanners: true,
    enableDataMinimization: true,
    enableAutomaticDeletion: true,
    requiredConsents: ['essential'],
    optionalConsents: ['analytics', 'marketing', 'personalization', 'cookies_analytics']
};
class GDPRComplianceService {
    static instance;
    config;
    constructor(config = {}) {
        this.config = { ...defaultConfig, ...config };
    }
    static getInstance(config) {
        if (!GDPRComplianceService.instance) {
            GDPRComplianceService.instance = new GDPRComplianceService(config);
        }
        return GDPRComplianceService.instance;
    }
    async recordConsent(userId, consentType, granted, purpose, req) {
        const start = Date.now();
        try {
            const consent = {
                id: crypto_1.default.randomUUID(),
                userId,
                consentType,
                purpose,
                granted,
                timestamp: new Date(),
                ipAddress: req.ip || 'unknown',
                userAgent: req.get('user-agent') || 'unknown',
                version: this.config.consentVersion,
                expiresAt: this.calculateConsentExpiry(consentType)
            };
            await database_1.prisma.userConsent.create({
                data: {
                    id: consent.id,
                    userId: consent.userId,
                    consentType: consent.consentType,
                    purpose: consent.purpose,
                    granted: consent.granted,
                    timestamp: consent.timestamp,
                    ipAddress: consent.ipAddress,
                    userAgent: consent.userAgent,
                    version: consent.version,
                    expiresAt: consent.expiresAt
                }
            });
            const cacheKey = `consent:${userId}:${consentType}`;
            await redis_1.redis.setex(cacheKey, 3600, JSON.stringify({
                granted,
                timestamp: consent.timestamp,
                expiresAt: consent.expiresAt
            }));
            logger_1.logger.info('Consent recorded', {
                userId,
                consentType,
                granted,
                purpose,
                ipAddress: consent.ipAddress
            });
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'gdpr_record_consent' }, Date.now() - start);
            return consent;
        }
        catch (error) {
            logger_1.logger.error('Failed to record consent', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'gdpr_record_consent_error' });
            throw error;
        }
    }
    async getUserConsent(userId, consentType) {
        const start = Date.now();
        try {
            const where = { userId };
            if (consentType) {
                where.consentType = consentType;
            }
            const consents = await database_1.prisma.userConsent.findMany({
                where,
                orderBy: { timestamp: 'desc' }
            });
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'gdpr_get_consent' }, Date.now() - start);
            return consents;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user consent', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'gdpr_get_consent_error' });
            throw error;
        }
    }
    async withdrawConsent(userId, consentType, req) {
        const start = Date.now();
        try {
            await this.recordConsent(userId, consentType, false, 'User withdrawal', req);
            const cacheKey = `consent:${userId}:${consentType}`;
            await redis_1.redis.del(cacheKey);
            if (consentType === 'analytics') {
                await this.cleanupAnalyticsData(userId);
            }
            logger_1.logger.info('Consent withdrawn', { userId, consentType });
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'gdpr_withdraw_consent' }, Date.now() - start);
        }
        catch (error) {
            logger_1.logger.error('Failed to withdraw consent', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'gdpr_withdraw_consent_error' });
            throw error;
        }
    }
    async hasValidConsent(userId, consentType) {
        const start = Date.now();
        try {
            const cacheKey = `consent:${userId}:${consentType}`;
            const cached = await redis_1.redis.get(cacheKey);
            if (cached) {
                const consent = JSON.parse(cached);
                const isExpired = consent.expiresAt && new Date(consent.expiresAt) < new Date();
                prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'gdpr_check_consent_cached' }, Date.now() - start);
                return consent.granted && !isExpired;
            }
            const latestConsent = await database_1.prisma.userConsent.findFirst({
                where: {
                    userId,
                    consentType
                },
                orderBy: { timestamp: 'desc' }
            });
            if (!latestConsent) {
                prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'gdpr_check_consent_db' }, Date.now() - start);
                return false;
            }
            const isExpired = latestConsent.expiresAt && latestConsent.expiresAt < new Date();
            const hasConsent = latestConsent.granted && !isExpired;
            await redis_1.redis.setex(cacheKey, 3600, JSON.stringify({
                granted: latestConsent.granted,
                timestamp: latestConsent.timestamp,
                expiresAt: latestConsent.expiresAt
            }));
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'gdpr_check_consent_db' }, Date.now() - start);
            return hasConsent;
        }
        catch (error) {
            logger_1.logger.error('Failed to check consent', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'gdpr_check_consent_error' });
            return false;
        }
    }
    async createDataExportRequest(userId) {
        const start = Date.now();
        try {
            const exportRequest = {
                id: crypto_1.default.randomUUID(),
                userId,
                status: 'pending',
                requestedAt: new Date()
            };
            await database_1.prisma.dataExportRequest.create({
                data: exportRequest
            });
            await this.queueDataExport(exportRequest);
            logger_1.logger.info('Data export request created', { userId, requestId: exportRequest.id });
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'gdpr_create_export_request' }, Date.now() - start);
            return exportRequest;
        }
        catch (error) {
            logger_1.logger.error('Failed to create data export request', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'gdpr_create_export_error' });
            throw error;
        }
    }
    async processDataExport(requestId) {
        const start = Date.now();
        try {
            const request = await database_1.prisma.dataExportRequest.findUnique({
                where: { id: requestId }
            });
            if (!request) {
                throw new Error('Export request not found');
            }
            await database_1.prisma.dataExportRequest.update({
                where: { id: requestId },
                data: { status: 'processing' }
            });
            const userData = await this.collectUserData(request.userId);
            const exportData = {
                exportMetadata: {
                    userId: request.userId,
                    requestId: requestId,
                    generatedAt: new Date(),
                    dataVersion: this.config.consentVersion
                },
                personalData: userData.personal,
                activityData: userData.activity,
                consentHistory: userData.consents,
                preferences: userData.preferences
            };
            const downloadUrl = await this.storeExportFile(requestId, exportData);
            const expiresAt = new Date(Date.now() + this.config.exportExpirationDays * 24 * 60 * 60 * 1000);
            await database_1.prisma.dataExportRequest.update({
                where: { id: requestId },
                data: {
                    status: 'completed',
                    completedAt: new Date(),
                    downloadUrl,
                    expiresAt
                }
            });
            logger_1.logger.info('Data export completed', { userId: request.userId, requestId });
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'gdpr_process_export' }, Date.now() - start);
        }
        catch (error) {
            logger_1.logger.error('Failed to process data export', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'gdpr_process_export_error' });
            await database_1.prisma.dataExportRequest.update({
                where: { id: requestId },
                data: { status: 'failed' }
            });
            throw error;
        }
    }
    async createDataDeletionRequest(userId, anonymizationLevel = 'partial') {
        const start = Date.now();
        try {
            const deletionRequest = {
                id: crypto_1.default.randomUUID(),
                userId,
                status: 'pending',
                requestedAt: new Date(),
                anonymizationLevel,
                retainedData: this.getRetainedDataFields(anonymizationLevel)
            };
            await database_1.prisma.dataDeletionRequest.create({
                data: deletionRequest
            });
            await this.scheduleDeletion(deletionRequest);
            logger_1.logger.info('Data deletion request created', {
                userId,
                requestId: deletionRequest.id,
                anonymizationLevel
            });
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'gdpr_create_deletion_request' }, Date.now() - start);
            return deletionRequest;
        }
        catch (error) {
            logger_1.logger.error('Failed to create data deletion request', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'gdpr_create_deletion_error' });
            throw error;
        }
    }
    consentMiddleware(requiredConsents) {
        return async (req, res, next) => {
            const start = Date.now();
            try {
                const userId = req.user?.id;
                if (!userId) {
                    return next();
                }
                const consentChecks = await Promise.all(requiredConsents.map(consent => this.hasValidConsent(userId, consent)));
                const missingConsents = requiredConsents.filter((_, index) => !consentChecks[index]);
                if (missingConsents.length > 0) {
                    logger_1.logger.warn('Missing required consents', {
                        userId,
                        missingConsents,
                        path: req.path
                    });
                    prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'gdpr_missing_consent' });
                    return res.status(403).json({
                        success: false,
                        error: {
                            code: 'CONSENT_REQUIRED',
                            message: 'Required consents not granted',
                            missingConsents
                        }
                    });
                }
                prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'gdpr_consent_middleware' }, Date.now() - start);
                next();
            }
            catch (error) {
                logger_1.logger.error('Consent middleware error', error);
                prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'gdpr_consent_middleware_error' });
                next();
            }
        };
    }
    calculateConsentExpiry(consentType) {
        if (consentType === 'essential') {
            return undefined;
        }
        return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }
    async queueDataExport(request) {
        await redis_1.redis.lpush('data_export_queue', JSON.stringify(request));
    }
    async collectUserData(userId) {
        const [user, jobs, payments, consents] = await Promise.all([
            database_1.prisma.user.findUnique({ where: { id: userId } }),
            database_1.prisma.job.findMany({ where: { userId } }),
            database_1.prisma.payment.findMany({ where: { userId } }),
            database_1.prisma.userConsent.findMany({ where: { userId } })
        ]);
        return {
            personal: user,
            activity: { jobs, payments },
            consents,
            preferences: {}
        };
    }
    async storeExportFile(requestId, data) {
        return `https://exports.finishthisidea.com/download/${requestId}`;
    }
    getRetainedDataFields(level) {
        if (level === 'full') {
            return [];
        }
        return [
            'aggregated_analytics',
            'transaction_records',
            'audit_logs'
        ];
    }
    async scheduleDeletion(request) {
        const deleteAt = new Date(request.requestedAt.getTime() + this.config.anonymizationDelayDays * 24 * 60 * 60 * 1000);
        await redis_1.redis.zadd('scheduled_deletions', deleteAt.getTime(), JSON.stringify(request));
    }
    async cleanupAnalyticsData(userId) {
        logger_1.logger.info('Cleaning up analytics data for user', { userId });
    }
    async getPendingExportRequest(userId) {
        try {
            const request = await database_1.prisma.dataExportRequest.findFirst({
                where: {
                    userId,
                    status: {
                        in: ['pending', 'processing']
                    }
                },
                orderBy: { requestedAt: 'desc' }
            });
            return request;
        }
        catch (error) {
            logger_1.logger.error('Failed to get pending export request', error);
            return null;
        }
    }
    async getUserExportRequests(userId) {
        try {
            const requests = await database_1.prisma.dataExportRequest.findMany({
                where: { userId },
                orderBy: { requestedAt: 'desc' }
            });
            return requests;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user export requests', error);
            return [];
        }
    }
    async getExportRequest(requestId) {
        try {
            const request = await database_1.prisma.dataExportRequest.findUnique({
                where: { id: requestId }
            });
            return request;
        }
        catch (error) {
            logger_1.logger.error('Failed to get export request', error);
            return null;
        }
    }
    async generateSecureDownloadUrl(requestId, userId) {
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await redis_1.redis.setex(`download:${token}`, 86400, JSON.stringify({
            requestId,
            userId,
            expiresAt
        }));
        return `${process.env.BACKEND_URL}/api/privacy/download/${token}`;
    }
    async getPendingDeletionRequest(userId) {
        try {
            const request = await database_1.prisma.dataDeletionRequest.findFirst({
                where: {
                    userId,
                    status: {
                        in: ['pending', 'processing']
                    }
                },
                orderBy: { requestedAt: 'desc' }
            });
            return request;
        }
        catch (error) {
            logger_1.logger.error('Failed to get pending deletion request', error);
            return null;
        }
    }
    async getUserDeletionRequests(userId) {
        try {
            const requests = await database_1.prisma.dataDeletionRequest.findMany({
                where: { userId },
                orderBy: { requestedAt: 'desc' }
            });
            return requests;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user deletion requests', error);
            return [];
        }
    }
    async cancelDeletionRequest(requestId, userId) {
        try {
            const request = await database_1.prisma.dataDeletionRequest.findUnique({
                where: { id: requestId }
            });
            if (!request || request.userId !== userId || request.status !== 'pending') {
                return false;
            }
            await database_1.prisma.dataDeletionRequest.update({
                where: { id: requestId },
                data: { status: 'cancelled' }
            });
            logger_1.logger.info('Deletion request cancelled', { requestId, userId });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to cancel deletion request', error);
            return false;
        }
    }
    async getUserDataAccessLog(userId, options = {}) {
        try {
            const { page = 1, limit = 20, startDate, endDate } = options;
            const skip = (page - 1) * limit;
            const where = { userId };
            if (startDate || endDate) {
                where.timestamp = {};
                if (startDate)
                    where.timestamp.gte = startDate;
                if (endDate)
                    where.timestamp.lte = endDate;
            }
            const [records, total] = await Promise.all([
                database_1.prisma.dataAccessLog.findMany({
                    where,
                    orderBy: { timestamp: 'desc' },
                    skip,
                    take: limit
                }),
                database_1.prisma.dataAccessLog.count({ where })
            ]);
            return {
                records,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get data access log', error);
            return {
                records: [],
                total: 0,
                page: 1,
                totalPages: 0
            };
        }
    }
    async getPrivacyPolicyStatus(userId) {
        try {
            const acceptance = await database_1.prisma.privacyPolicyAcceptance.findFirst({
                where: { userId },
                orderBy: { acceptedAt: 'desc' }
            });
            const currentVersion = this.config.consentVersion;
            return {
                accepted: !!acceptance,
                version: acceptance?.version || 'none',
                acceptedAt: acceptance?.acceptedAt,
                current: acceptance?.version === currentVersion
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get privacy policy status', error);
            return {
                accepted: false,
                version: 'none',
                current: false
            };
        }
    }
    async acceptPrivacyPolicy(userId, version, req) {
        try {
            await database_1.prisma.privacyPolicyAcceptance.create({
                data: {
                    userId,
                    version,
                    acceptedAt: new Date(),
                    ipAddress: req.ip || 'unknown',
                    userAgent: req.get('user-agent') || 'unknown'
                }
            });
            logger_1.logger.info('Privacy policy accepted', { userId, version });
        }
        catch (error) {
            logger_1.logger.error('Failed to accept privacy policy', error);
            throw error;
        }
    }
    async logDataAccess(userId, dataType, action, details, req) {
        try {
            await database_1.prisma.dataAccessLog.create({
                data: {
                    userId,
                    dataType,
                    action,
                    details: JSON.stringify(details),
                    timestamp: new Date(),
                    ipAddress: req.ip || 'unknown',
                    userAgent: req.get('user-agent') || 'unknown',
                    requestId: req.requestId || 'unknown'
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to log data access', error);
        }
    }
    dataAccessMiddleware(dataType, action) {
        return async (req, res, next) => {
            try {
                const userId = req.user?.id;
                if (userId) {
                    await this.logDataAccess(userId, dataType, action, {
                        path: req.path,
                        method: req.method,
                        query: req.query,
                        params: req.params
                    }, req);
                }
                next();
            }
            catch (error) {
                logger_1.logger.error('Data access middleware error', error);
                next();
            }
        };
    }
    async cleanupExpiredConsents() {
        try {
            const expiredConsents = await database_1.prisma.userConsent.findMany({
                where: {
                    expiresAt: {
                        lt: new Date()
                    },
                    granted: true
                }
            });
            let cleanedCount = 0;
            for (const consent of expiredConsents) {
                await this.recordConsent(consent.userId, consent.consentType, false, 'Automatic expiry', { ip: 'system', get: () => 'system' });
                cleanedCount++;
            }
            logger_1.logger.info('Expired consents cleaned up', { cleanedCount });
            return cleanedCount;
        }
        catch (error) {
            logger_1.logger.error('Failed to cleanup expired consents', error);
            return 0;
        }
    }
}
exports.GDPRComplianceService = GDPRComplianceService;
exports.gdprService = GDPRComplianceService.getInstance();
//# sourceMappingURL=gdpr.service.js.map