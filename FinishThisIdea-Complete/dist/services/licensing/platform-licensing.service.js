"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformLicensingService = void 0;
const events_1 = require("events");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
const logger_1 = require("../../utils/logger");
const payment_service_1 = require("../payment/payment.service");
const multi_tenant_service_1 = require("../multi-tenant/multi-tenant.service");
const email_queue_service_1 = require("../email/email-queue.service");
class PlatformLicensingService extends events_1.EventEmitter {
    prisma;
    paymentService;
    multiTenantService;
    emailQueue;
    licenses = new Map();
    usageTracking = new Map();
    revenueShares = new Map();
    constructor() {
        super();
        this.prisma = new client_1.PrismaClient();
        this.paymentService = new payment_service_1.PaymentService();
        this.multiTenantService = new multi_tenant_service_1.MultiTenantService();
        this.emailQueue = new email_queue_service_1.EmailQueueService();
        this.initializeLicenseTypes();
        this.startUsageTracking();
    }
    initializeLicenseTypes() {
        this.licenseTypes = {
            standard: {
                name: 'Standard License',
                price: 99,
                features: [
                    'Remove FinishThisIdea branding',
                    'Custom domain',
                    'Up to 100 users',
                    '10GB storage',
                    '100k API calls/month',
                    'Email support'
                ],
                limits: {
                    users: 100,
                    projects: 1000,
                    apiCalls: 100000,
                    storage: 10,
                    customDomains: 1
                }
            },
            professional: {
                name: 'Professional License',
                price: 299,
                features: [
                    'Everything in Standard',
                    'White-label deployment',
                    'Up to 1000 users',
                    '100GB storage',
                    '1M API calls/month',
                    'Priority support',
                    'Custom integrations'
                ],
                limits: {
                    users: 1000,
                    projects: 10000,
                    apiCalls: 1000000,
                    storage: 100,
                    customDomains: 3
                }
            },
            enterprise: {
                name: 'Enterprise License',
                price: 999,
                features: [
                    'Everything in Professional',
                    'Unlimited users',
                    '1TB storage',
                    'Unlimited API calls',
                    'Dedicated support',
                    'SLA guarantee',
                    'Custom features',
                    'Source code access'
                ],
                limits: {
                    users: -1,
                    projects: -1,
                    apiCalls: -1,
                    storage: 1000,
                    customDomains: -1
                }
            },
            whitelabel: {
                name: 'White-Label Partner',
                price: 2499,
                features: [
                    'Complete white-label solution',
                    'Revenue sharing (70/30)',
                    'Multi-tenant architecture',
                    'Sub-license creation',
                    'Partner dashboard',
                    'Marketing materials',
                    'Technical training',
                    'Dedicated account manager'
                ],
                limits: {
                    users: -1,
                    projects: -1,
                    apiCalls: -1,
                    storage: -1,
                    customDomains: -1,
                    subLicenses: -1
                },
                revenueShare: 30
            }
        };
    }
    async createLicense(options) {
        try {
            const licenseType = this.licenseTypes[options.type];
            if (!licenseType) {
                throw new Error('Invalid license type');
            }
            const licenseKey = this.generateLicenseKey(options.type);
            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            const license = {
                id: licenseKey,
                name: options.name,
                type: options.type,
                status: 'pending',
                features: licenseType.features,
                limits: licenseType.limits,
                billing: {
                    amount: licenseType.price,
                    currency: 'USD',
                    interval: 'yearly',
                    revenueShare: licenseType.revenueShare
                },
                branding: {
                    removeBranding: true,
                    customLogo: options.customization?.logo,
                    customColors: options.customization?.colors,
                    customDomain: options.customization?.domain,
                    customEmails: ['professional', 'enterprise', 'whitelabel'].includes(options.type)
                },
                metadata: {
                    company: options.company,
                    email: options.email,
                    activationCode: crypto.randomBytes(16).toString('hex')
                },
                createdAt: new Date(),
                expiresAt,
                lastActiveAt: new Date()
            };
            if (options.parentLicenseId) {
                const parentLicense = await this.getLicense(options.parentLicenseId);
                if (!parentLicense || parentLicense.type !== 'whitelabel') {
                    throw new Error('Invalid parent license');
                }
                license.parent = {
                    licenseId: options.parentLicenseId,
                    revenueShare: parentLicense.billing.revenueShare || 30
                };
            }
            if (['enterprise', 'whitelabel'].includes(options.type)) {
                const tenant = await this.multiTenantService.createTenant({
                    name: options.company || options.name,
                    tier: 'enterprise',
                    customConfig: {
                        licenseId: licenseKey,
                        whiteLabel: true
                    }
                });
                license.tenant = {
                    tenantId: tenant.id,
                    isolationLevel: 'dedicated'
                };
            }
            this.licenses.set(licenseKey, license);
            await this.saveLicense(license);
            await this.emailQueue.queueEmail({
                to: options.email,
                template: 'license-activation',
                data: {
                    name: options.name,
                    licenseKey,
                    licenseType: licenseType.name,
                    activationUrl: `https://app.finishthisidea.com/activate/${license.metadata.activationCode}`,
                    features: licenseType.features
                }
            });
            logger_1.logger.info('License created', {
                licenseId: licenseKey,
                type: options.type,
                company: options.company
            });
            return license;
        }
        catch (error) {
            logger_1.logger.error('Error creating license', error);
            throw error;
        }
    }
    async activateLicense(activationCode) {
        const license = Array.from(this.licenses.values()).find(l => l.metadata.activationCode === activationCode);
        if (!license) {
            throw new Error('Invalid activation code');
        }
        if (license.status !== 'pending') {
            throw new Error('License already activated');
        }
        license.status = 'active';
        license.metadata.activatedAt = new Date();
        if (license.billing.amount > 0) {
            const payment = await this.paymentService.createPayment({
                amount: license.billing.amount,
                currency: license.billing.currency,
                description: `${license.type} License Activation`,
                metadata: {
                    licenseId: license.id,
                    type: 'license_activation'
                }
            });
            license.metadata.paymentId = payment.id;
        }
        await this.saveLicense(license);
        await this.emailQueue.queueEmail({
            to: license.metadata.email,
            template: 'license-activated',
            data: {
                name: license.name,
                licenseKey: license.id,
                dashboardUrl: license.branding.customDomain
                    ? `https://${license.branding.customDomain}/dashboard`
                    : 'https://app.finishthisidea.com/dashboard'
            }
        });
        this.emit('license-activated', license);
        return license;
    }
    async validateLicense(licenseKey) {
        const license = await this.getLicense(licenseKey);
        if (!license) {
            return { valid: false, reason: 'License not found' };
        }
        if (license.status !== 'active') {
            return { valid: false, reason: `License is ${license.status}` };
        }
        if (license.expiresAt && new Date() > license.expiresAt) {
            license.status = 'expired';
            await this.saveLicense(license);
            return { valid: false, reason: 'License expired' };
        }
        license.lastActiveAt = new Date();
        await this.saveLicense(license);
        return { valid: true, license };
    }
    async checkLimits(licenseKey, resource, amount = 1) {
        const validation = await this.validateLicense(licenseKey);
        if (!validation.valid) {
            return { allowed: false, reason: validation.reason };
        }
        const license = validation.license;
        const usage = await this.getUsage(licenseKey);
        const limit = license.limits[resource];
        if (limit === -1) {
            return { allowed: true };
        }
        const current = usage.metrics[resource] || 0;
        if (current + amount > limit) {
            return {
                allowed: false,
                current,
                limit,
                reason: `${resource} limit exceeded`
            };
        }
        return { allowed: true, current, limit };
    }
    async trackUsage(licenseKey, metric, amount = 1) {
        const usage = await this.getUsage(licenseKey);
        if (!usage.metrics[metric]) {
            usage.metrics[metric] = 0;
        }
        usage.metrics[metric] += amount;
        this.usageTracking.set(licenseKey, usage);
        const limitsCheck = await this.checkLimits(licenseKey, metric, 0);
        if (!limitsCheck.allowed) {
            this.emit('limit-exceeded', {
                licenseKey,
                metric,
                current: limitsCheck.current,
                limit: limitsCheck.limit
            });
        }
    }
    async createSubLicense(parentLicenseKey, options) {
        const parentLicense = await this.getLicense(parentLicenseKey);
        if (!parentLicense || parentLicense.type !== 'whitelabel') {
            throw new Error('Only white-label partners can create sub-licenses');
        }
        const subLicense = await this.createLicense({
            ...options,
            parentLicenseId: parentLicenseKey
        });
        if (options.customPrice) {
            subLicense.billing.amount = options.customPrice;
        }
        return subLicense;
    }
    async calculateRevenueShares(period = new Date()) {
        const licenses = Array.from(this.licenses.values());
        for (const license of licenses) {
            if (!license.parent)
                continue;
            const usage = await this.getUsage(license.id);
            const revenue = usage.metrics.revenue || 0;
            if (revenue > 0) {
                const parentShare = (revenue * license.parent.revenueShare) / 100;
                const platformShare = revenue - parentShare;
                const revenueShare = {
                    licenseId: license.id,
                    parentLicenseId: license.parent.licenseId,
                    amount: parentShare,
                    percentage: license.parent.revenueShare,
                    period,
                    status: 'pending'
                };
                if (!this.revenueShares.has(license.parent.licenseId)) {
                    this.revenueShares.set(license.parent.licenseId, []);
                }
                this.revenueShares.get(license.parent.licenseId).push(revenueShare);
                await this.processRevenuePayout(revenueShare);
                logger_1.logger.info('Revenue share calculated', {
                    licenseId: license.id,
                    parentLicenseId: license.parent.licenseId,
                    amount: parentShare,
                    platformShare
                });
            }
        }
    }
    async processRevenuePayout(revenueShare) {
        try {
            const parentLicense = await this.getLicense(revenueShare.parentLicenseId);
            if (!parentLicense)
                return;
            const payout = await this.paymentService.createPayout({
                amount: revenueShare.amount,
                currency: 'USD',
                recipient: parentLicense.metadata.payoutMethod || parentLicense.metadata.email,
                description: `Revenue share for period ${revenueShare.period.toLocaleDateString()}`,
                metadata: {
                    licenseId: revenueShare.licenseId,
                    parentLicenseId: revenueShare.parentLicenseId,
                    period: revenueShare.period.toISOString()
                }
            });
            revenueShare.status = 'paid';
            revenueShare.paidAt = new Date();
            await this.emailQueue.queueEmail({
                to: parentLicense.metadata.email,
                template: 'revenue-share-payout',
                data: {
                    name: parentLicense.name,
                    amount: revenueShare.amount,
                    period: revenueShare.period.toLocaleDateString(),
                    dashboardUrl: 'https://partners.finishthisidea.com/payouts'
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error processing revenue payout', error);
            revenueShare.status = 'failed';
        }
    }
    async getLicenseDashboard(licenseKey) {
        const license = await this.getLicense(licenseKey);
        if (!license) {
            throw new Error('License not found');
        }
        const usage = await this.getUsage(licenseKey);
        const dashboard = {
            license,
            usage,
            analytics: {
                totalRevenue: usage.metrics.revenue || 0,
                activeUsers: usage.metrics.activeUsers || 0,
                projectsCreated: usage.metrics.projectsCreated || 0,
                storageUsed: usage.metrics.storageUsed || 0,
                apiUsage: usage.metrics.apiCallsMade || 0
            }
        };
        if (license.type === 'whitelabel') {
            dashboard.subLicenses = Array.from(this.licenses.values()).filter(l => l.parent?.licenseId === licenseKey);
            dashboard.revenueShares = this.revenueShares.get(licenseKey) || [];
            dashboard.analytics.totalRevenue = dashboard.revenueShares.reduce((total, share) => total + share.amount, 0);
        }
        return dashboard;
    }
    async suspendLicense(licenseKey, reason) {
        const license = await this.getLicense(licenseKey);
        if (!license) {
            throw new Error('License not found');
        }
        license.status = 'suspended';
        license.metadata.suspendedAt = new Date();
        license.metadata.suspensionReason = reason;
        await this.saveLicense(license);
        await this.emailQueue.queueEmail({
            to: license.metadata.email,
            template: 'license-suspended',
            data: {
                name: license.name,
                reason,
                supportUrl: 'https://support.finishthisidea.com'
            }
        });
        this.emit('license-suspended', { licenseKey, reason });
    }
    async renewLicense(licenseKey, period = 1) {
        const license = await this.getLicense(licenseKey);
        if (!license) {
            throw new Error('License not found');
        }
        const payment = await this.paymentService.createPayment({
            amount: license.billing.amount * period,
            currency: license.billing.currency,
            description: `License Renewal - ${period} year(s)`,
            metadata: {
                licenseId: license.id,
                type: 'license_renewal',
                period
            }
        });
        if (license.expiresAt) {
            license.expiresAt.setFullYear(license.expiresAt.getFullYear() + period);
        }
        else {
            license.expiresAt = new Date();
            license.expiresAt.setFullYear(license.expiresAt.getFullYear() + period);
        }
        license.status = 'active';
        license.metadata.lastRenewalAt = new Date();
        license.metadata.renewalPaymentId = payment.id;
        await this.saveLicense(license);
        await this.emailQueue.queueEmail({
            to: license.metadata.email,
            template: 'license-renewed',
            data: {
                name: license.name,
                newExpiryDate: license.expiresAt.toLocaleDateString(),
                period
            }
        });
        return license;
    }
    async transferLicense(licenseKey, newOwner) {
        const license = await this.getLicense(licenseKey);
        if (!license) {
            throw new Error('License not found');
        }
        const oldOwner = {
            name: license.name,
            email: license.metadata.email,
            company: license.metadata.company
        };
        license.name = newOwner.name;
        license.metadata.email = newOwner.email;
        license.metadata.company = newOwner.company;
        license.metadata.transferredAt = new Date();
        license.metadata.previousOwner = oldOwner;
        await this.saveLicense(license);
        await Promise.all([
            this.emailQueue.queueEmail({
                to: oldOwner.email,
                template: 'license-transferred-from',
                data: {
                    name: oldOwner.name,
                    newOwnerName: newOwner.name,
                    licenseKey
                }
            }),
            this.emailQueue.queueEmail({
                to: newOwner.email,
                template: 'license-transferred-to',
                data: {
                    name: newOwner.name,
                    licenseKey,
                    dashboardUrl: 'https://app.finishthisidea.com/dashboard'
                }
            })
        ]);
        this.emit('license-transferred', {
            licenseKey,
            from: oldOwner,
            to: newOwner
        });
    }
    generateLicenseKey(type) {
        const prefix = type.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(8).toString('hex');
        return `${prefix}-${timestamp}-${random}`.toUpperCase();
    }
    async getLicense(licenseKey) {
        let license = this.licenses.get(licenseKey);
        if (!license) {
            license = await this.loadLicenseFromDatabase(licenseKey);
            if (license) {
                this.licenses.set(licenseKey, license);
            }
        }
        return license;
    }
    async getUsage(licenseKey) {
        let usage = this.usageTracking.get(licenseKey);
        if (!usage) {
            usage = {
                licenseId: licenseKey,
                period: new Date(),
                metrics: {
                    activeUsers: 0,
                    projectsCreated: 0,
                    apiCallsMade: 0,
                    storageUsed: 0,
                    revenue: 0
                }
            };
            this.usageTracking.set(licenseKey, usage);
        }
        return usage;
    }
    async saveLicense(license) {
        logger_1.logger.info('Saving license', { licenseId: license.id });
    }
    async loadLicenseFromDatabase(licenseKey) {
        return null;
    }
    startUsageTracking() {
        setInterval(() => {
            const now = new Date();
            if (now.getDate() === 1) {
                this.usageTracking.forEach((usage, licenseKey) => {
                    usage.period = now;
                    usage.metrics = {
                        activeUsers: 0,
                        projectsCreated: 0,
                        apiCallsMade: 0,
                        storageUsed: usage.metrics.storageUsed,
                        revenue: 0
                    };
                });
            }
        }, 24 * 60 * 60 * 1000);
    }
    licenseTypes = {};
}
exports.PlatformLicensingService = PlatformLicensingService;
//# sourceMappingURL=platform-licensing.service.js.map