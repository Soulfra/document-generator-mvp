"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trustTierService = exports.TrustTierService = exports.TrustTier = void 0;
const database_1 = require("../../utils/database");
const platform_logger_service_1 = require("../monitoring/platform-logger.service");
const cleanup_memory_service_1 = require("../memory/cleanup-memory.service");
const serviceLogger = platform_logger_service_1.platformLogger.createServiceLogger('trust-tier-service');
var TrustTier;
(function (TrustTier) {
    TrustTier["BRONZE"] = "BRONZE";
    TrustTier["SILVER"] = "SILVER";
    TrustTier["GOLD"] = "GOLD";
    TrustTier["PLATINUM"] = "PLATINUM";
})(TrustTier || (exports.TrustTier = TrustTier = {}));
const TIER_FEATURES = {
    [TrustTier.BRONZE]: {
        maxFileSize: 10,
        maxFilesPerUpload: 50,
        allowedFileTypes: ['.zip', '.tar.gz'],
        maxJobsPerDay: 5,
        maxJobsPerMonth: 50,
        allowClaude: false,
        allowBulkOperations: false,
        allowAdvancedFeatures: false,
        backupRetentionDays: 7,
        priorityProcessing: false,
        customProfiles: 1
    },
    [TrustTier.SILVER]: {
        maxFileSize: 25,
        maxFilesPerUpload: 200,
        allowedFileTypes: ['.zip', '.tar.gz', '.tgz'],
        maxJobsPerDay: 20,
        maxJobsPerMonth: 200,
        allowClaude: true,
        allowBulkOperations: false,
        allowAdvancedFeatures: true,
        backupRetentionDays: 14,
        priorityProcessing: false,
        customProfiles: 3
    },
    [TrustTier.GOLD]: {
        maxFileSize: 50,
        maxFilesPerUpload: 500,
        allowedFileTypes: ['.zip', '.tar.gz', '.tgz', '.7z'],
        maxJobsPerDay: 50,
        maxJobsPerMonth: 500,
        allowClaude: true,
        allowBulkOperations: true,
        allowAdvancedFeatures: true,
        backupRetentionDays: 30,
        priorityProcessing: true,
        customProfiles: 10
    },
    [TrustTier.PLATINUM]: {
        maxFileSize: 100,
        maxFilesPerUpload: 1000,
        allowedFileTypes: ['.zip', '.tar.gz', '.tgz', '.7z', '.rar'],
        maxJobsPerDay: -1,
        maxJobsPerMonth: -1,
        allowClaude: true,
        allowBulkOperations: true,
        allowAdvancedFeatures: true,
        backupRetentionDays: 90,
        priorityProcessing: true,
        customProfiles: -1
    }
};
const TIER_REQUIREMENTS = {
    [TrustTier.SILVER]: {
        minJobs: 5,
        minSuccessRate: 0.8,
        minSpent: 5,
        minAccountAge: 7,
        maxViolations: 2
    },
    [TrustTier.GOLD]: {
        minJobs: 20,
        minSuccessRate: 0.9,
        minSpent: 20,
        minAccountAge: 30,
        maxViolations: 1
    },
    [TrustTier.PLATINUM]: {
        minJobs: 100,
        minSuccessRate: 0.95,
        minSpent: 100,
        minAccountAge: 90,
        maxViolations: 0
    }
};
class TrustTierService {
    async getUserTrustMetrics(userId) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    jobs: {
                        select: {
                            status: true,
                            createdAt: true,
                            payment: {
                                select: {
                                    amount: true,
                                    status: true
                                }
                            }
                        }
                    }
                }
            });
            if (!user) {
                throw new Error('User not found');
            }
            const totalJobs = user.jobs.length;
            const successfulJobs = user.jobs.filter(j => j.status === 'COMPLETED').length;
            const failedJobs = user.jobs.filter(j => j.status === 'FAILED').length;
            const successRate = totalJobs > 0 ? successfulJobs / totalJobs : 0;
            const totalSpent = user.jobs.reduce((sum, job) => {
                if (job.payment?.status === 'SUCCEEDED') {
                    return sum + (job.payment.amount / 100);
                }
                return sum;
            }, 0);
            const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            const userMetadata = user.metadata || {};
            const violations = userMetadata.violations || 0;
            const lastViolation = userMetadata.lastViolation ?
                new Date(userMetadata.lastViolation) : undefined;
            const currentTier = await this.calculateUserTier({
                totalJobs,
                successRate,
                totalSpent,
                accountAge,
                violations
            });
            return {
                userId,
                currentTier,
                totalJobs,
                successfulJobs,
                failedJobs,
                successRate,
                totalSpent,
                accountAge,
                violations,
                lastViolation
            };
        }
        catch (error) {
            serviceLogger.error(error, { userId, operation: 'get-trust-metrics' });
            throw error;
        }
    }
    async calculateUserTier(metrics) {
        const platinumReqs = TIER_REQUIREMENTS[TrustTier.PLATINUM];
        if (metrics.totalJobs >= platinumReqs.minJobs &&
            metrics.successRate >= platinumReqs.minSuccessRate &&
            metrics.totalSpent >= platinumReqs.minSpent &&
            metrics.accountAge >= platinumReqs.minAccountAge &&
            metrics.violations <= platinumReqs.maxViolations) {
            return TrustTier.PLATINUM;
        }
        const goldReqs = TIER_REQUIREMENTS[TrustTier.GOLD];
        if (metrics.totalJobs >= goldReqs.minJobs &&
            metrics.successRate >= goldReqs.minSuccessRate &&
            metrics.totalSpent >= goldReqs.minSpent &&
            metrics.accountAge >= goldReqs.minAccountAge &&
            metrics.violations <= goldReqs.maxViolations) {
            return TrustTier.GOLD;
        }
        const silverReqs = TIER_REQUIREMENTS[TrustTier.SILVER];
        if (metrics.totalJobs >= silverReqs.minJobs &&
            metrics.successRate >= silverReqs.minSuccessRate &&
            metrics.totalSpent >= silverReqs.minSpent &&
            metrics.accountAge >= silverReqs.minAccountAge &&
            metrics.violations <= silverReqs.maxViolations) {
            return TrustTier.SILVER;
        }
        return TrustTier.BRONZE;
    }
    async checkTierPermission(userId, feature, value) {
        try {
            const metrics = await this.getUserTrustMetrics(userId);
            const tierFeatures = TIER_FEATURES[metrics.currentTier];
            if (typeof tierFeatures[feature] === 'boolean') {
                const allowed = tierFeatures[feature];
                if (!allowed) {
                    return {
                        allowed: false,
                        reason: `This feature requires ${this.getRequiredTierForFeature(feature)} tier or higher`
                    };
                }
                return { allowed: true };
            }
            if (typeof tierFeatures[feature] === 'number' && value !== undefined) {
                const limit = tierFeatures[feature];
                if (limit === -1) {
                    return { allowed: true };
                }
                if (value > limit) {
                    return {
                        allowed: false,
                        reason: `Your ${metrics.currentTier} tier allows up to ${limit} for this feature`
                    };
                }
                return { allowed: true };
            }
            if (Array.isArray(tierFeatures[feature]) && value !== undefined) {
                const allowedValues = tierFeatures[feature];
                if (!allowedValues.includes(value)) {
                    return {
                        allowed: false,
                        reason: `Your ${metrics.currentTier} tier doesn't support ${value}`
                    };
                }
                return { allowed: true };
            }
            return { allowed: true };
        }
        catch (error) {
            serviceLogger.error(error, { userId, feature, operation: 'check-permission' });
            return {
                allowed: false,
                reason: 'Unable to verify permissions at this time'
            };
        }
    }
    async checkRateLimits(userId) {
        try {
            const metrics = await this.getUserTrustMetrics(userId);
            const features = TIER_FEATURES[metrics.currentTier];
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const jobsToday = await database_1.prisma.job.count({
                where: {
                    userId,
                    createdAt: {
                        gte: today
                    }
                }
            });
            if (features.maxJobsPerDay !== -1 && jobsToday >= features.maxJobsPerDay) {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                return {
                    allowed: false,
                    remaining: 0,
                    resetAt: tomorrow,
                    reason: `Daily limit of ${features.maxJobsPerDay} jobs reached for ${metrics.currentTier} tier`
                };
            }
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const jobsThisMonth = await database_1.prisma.job.count({
                where: {
                    userId,
                    createdAt: {
                        gte: startOfMonth
                    }
                }
            });
            if (features.maxJobsPerMonth !== -1 && jobsThisMonth >= features.maxJobsPerMonth) {
                const nextMonth = new Date(startOfMonth);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                return {
                    allowed: false,
                    remaining: 0,
                    resetAt: nextMonth,
                    reason: `Monthly limit of ${features.maxJobsPerMonth} jobs reached for ${metrics.currentTier} tier`
                };
            }
            return {
                allowed: true,
                remaining: features.maxJobsPerDay === -1 ?
                    undefined : features.maxJobsPerDay - jobsToday
            };
        }
        catch (error) {
            serviceLogger.error(error, { userId, operation: 'check-rate-limits' });
            return {
                allowed: false,
                reason: 'Unable to verify rate limits at this time'
            };
        }
    }
    async recordViolation(userId, type, description) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user)
                return;
            const metadata = user.metadata || {};
            const violations = (metadata.violations || 0) + 1;
            await database_1.prisma.user.update({
                where: { id: userId },
                data: {
                    metadata: {
                        ...metadata,
                        violations,
                        lastViolation: new Date().toISOString(),
                        violationHistory: [
                            ...(metadata.violationHistory || []),
                            {
                                type,
                                description,
                                timestamp: new Date().toISOString()
                            }
                        ]
                    }
                }
            });
            await cleanup_memory_service_1.cleanupMemory.logThought({
                userId,
                eventType: 'violation',
                reasoning: {
                    intent: 'User violation recorded',
                    confidence: 1.0,
                    decisionPath: ['Violation detected', 'Recorded in user metadata'],
                    alternativesConsidered: []
                },
                context: {
                    violationType: type,
                    description,
                    totalViolations: violations
                }
            });
            serviceLogger.warn('User violation recorded', {
                userId,
                type,
                description,
                totalViolations: violations
            });
        }
        catch (error) {
            serviceLogger.error(error, { userId, type, operation: 'record-violation' });
        }
    }
    getTierFeatures(tier) {
        return TIER_FEATURES[tier];
    }
    getAllTiers() {
        return Object.entries(TIER_FEATURES).map(([tier, features]) => ({
            tier,
            features,
            requirements: TIER_REQUIREMENTS[tier]
        }));
    }
    getRequiredTierForFeature(feature) {
        const tiers = [TrustTier.BRONZE, TrustTier.SILVER, TrustTier.GOLD, TrustTier.PLATINUM];
        for (const tier of tiers) {
            const tierFeatures = TIER_FEATURES[tier];
            if (typeof tierFeatures[feature] === 'boolean' && tierFeatures[feature]) {
                return tier;
            }
        }
        return TrustTier.PLATINUM;
    }
    async checkForTierUpgrade(userId) {
        try {
            const metrics = await this.getUserTrustMetrics(userId);
            const calculatedTier = await this.calculateUserTier({
                totalJobs: metrics.totalJobs,
                successRate: metrics.successRate,
                totalSpent: metrics.totalSpent,
                accountAge: metrics.accountAge,
                violations: metrics.violations
            });
            const tierOrder = [TrustTier.BRONZE, TrustTier.SILVER, TrustTier.GOLD, TrustTier.PLATINUM];
            const currentIndex = tierOrder.indexOf(metrics.currentTier);
            const calculatedIndex = tierOrder.indexOf(calculatedTier);
            if (calculatedIndex > currentIndex) {
                await cleanup_memory_service_1.cleanupMemory.logThought({
                    userId,
                    eventType: 'tier-upgrade',
                    reasoning: {
                        intent: 'User tier upgraded based on metrics',
                        confidence: 1.0,
                        decisionPath: ['Metrics evaluated', 'Tier requirements met', 'Upgrade approved'],
                        alternativesConsidered: []
                    },
                    learning: {
                        newPatterns: [`User upgraded from ${metrics.currentTier} to ${calculatedTier}`],
                        improvementNotes: [`Success rate: ${metrics.successRate}, Total spent: $${metrics.totalSpent}`]
                    }
                });
                return {
                    shouldUpgrade: true,
                    newTier: calculatedTier,
                    currentTier: metrics.currentTier
                };
            }
            return {
                shouldUpgrade: false,
                currentTier: metrics.currentTier
            };
        }
        catch (error) {
            serviceLogger.error(error, { userId, operation: 'check-tier-upgrade' });
            return {
                shouldUpgrade: false,
                currentTier: TrustTier.BRONZE
            };
        }
    }
}
exports.TrustTierService = TrustTierService;
exports.trustTierService = new TrustTierService();
//# sourceMappingURL=trust-tier.service.js.map