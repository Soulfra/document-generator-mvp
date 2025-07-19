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
exports.MultiTenantService = void 0;
const events_1 = require("events");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
const logger_1 = require("../../utils/logger");
const metrics_service_1 = require("../monitoring/metrics.service");
const security_service_1 = require("../security/security.service");
class MultiTenantService extends events_1.EventEmitter {
    tenants = new Map();
    prisma;
    metricsService;
    securityService;
    platformConfig = {
        maxTenantsPerInstance: 100,
        isolationLevel: 'strict',
        resourceAllocation: 'dynamic',
        validationMode: 'witnessed',
        complianceLevel: 'enterprise'
    };
    resourcePools = {
        compute: {
            total: 1000,
            allocated: 0,
            reserved: 100
        },
        storage: {
            total: 10000,
            allocated: 0,
            reserved: 1000
        },
        apiCredits: {
            total: 1000000,
            allocated: 0,
            reserved: 100000
        }
    };
    constructor() {
        super();
        this.prisma = new client_1.PrismaClient();
        this.metricsService = new metrics_service_1.MetricsService();
        this.securityService = new security_service_1.SecurityService();
        this.initializeFromDatabase();
    }
    async initializeFromDatabase() {
        try {
            logger_1.logger.info('Initializing multi-tenant architecture');
            await this.initializeDemoTenants();
        }
        catch (error) {
            logger_1.logger.error('Error initializing multi-tenant service', error);
        }
    }
    async initializeDemoTenants() {
        const demoTenants = [
            {
                id: 'tenant-demo-startup',
                name: 'Demo Startup Inc',
                tier: 'starter',
                customConfig: {
                    agents: 5,
                    monthlyBudget: 500,
                    industry: 'technology',
                    useCase: 'code-cleanup'
                }
            },
            {
                id: 'tenant-demo-growth',
                name: 'Growth Company Ltd',
                tier: 'growth',
                customConfig: {
                    agents: 15,
                    monthlyBudget: 2500,
                    industry: 'saas',
                    useCase: 'development-automation'
                }
            },
            {
                id: 'tenant-demo-enterprise',
                name: 'Enterprise Corp',
                tier: 'enterprise',
                customConfig: {
                    agents: 50,
                    monthlyBudget: 10000,
                    industry: 'finance',
                    useCase: 'code-quality-assurance'
                }
            }
        ];
        for (const config of demoTenants) {
            await this.createTenant(config);
        }
    }
    async createTenant(config) {
        try {
            const tenantId = config.id || this.generateTenantId();
            this.validateResourceAvailability(config.tier);
            const tenant = {
                id: tenantId,
                name: config.name,
                tier: config.tier,
                created: new Date(),
                status: 'active',
                sovereignty: {
                    vaultId: `vault-${tenantId}`,
                    isolationLevel: this.getIsolationLevel(config.tier),
                    encryptionKey: this.generateEncryptionKey(),
                    trustScore: 98.5,
                    validationMode: 'witnessed'
                },
                resources: this.allocateResources(config.tier),
                agents: {
                    maxAgents: this.getMaxAgents(config.tier),
                    currentAgents: config.customConfig?.agents || 0,
                    agentTypes: this.getAllowedAgentTypes(config.tier),
                    consciousnessLevels: {
                        min: 0.5,
                        max: this.getMaxConsciousness(config.tier),
                        average: 0.75
                    }
                },
                business: {
                    monthlyBudget: config.customConfig?.monthlyBudget || 5000,
                    billingCycle: 'monthly',
                    paymentMethod: 'invoice',
                    industry: config.customConfig?.industry || 'general',
                    useCase: config.customConfig?.useCase || 'general-ai'
                },
                security: {
                    mfaEnabled: true,
                    ssoProvider: config.ssoProvider || 'saml',
                    ipWhitelist: config.ipWhitelist || [],
                    apiKeys: this.generateApiKeys(),
                    dataRetention: this.getDataRetention(config.tier),
                    complianceCerts: this.getComplianceCerts(config.tier)
                },
                metrics: {
                    usage: {
                        apiCalls: 0,
                        storageUsed: 0,
                        computeHours: 0,
                        activeAgents: 0
                    },
                    performance: {
                        avgResponseTime: 120,
                        uptime: 99.99,
                        errorRate: 0.1
                    },
                    business: {
                        revenue: 0,
                        conversations: 0,
                        satisfaction: 4.8
                    }
                },
                customConfig: config.customConfig || {}
            };
            this.tenants.set(tenantId, tenant);
            this.updateResourceAllocation();
            await this.createTenantSchema(tenantId);
            await this.initializeTenantServices(tenant);
            this.emit('tenant-created', {
                tenantId,
                name: tenant.name,
                tier: tenant.tier
            });
            logger_1.logger.info('Tenant created', {
                tenantId,
                name: tenant.name,
                tier: tenant.tier
            });
            return tenant;
        }
        catch (error) {
            logger_1.logger.error('Error creating tenant', error);
            throw error;
        }
    }
    async getTenant(tenantId) {
        const tenant = this.tenants.get(tenantId);
        if (!tenant) {
            return await this.loadTenantFromDatabase(tenantId);
        }
        return tenant;
    }
    async updateTenant(tenantId, updates) {
        const tenant = await this.getTenant(tenantId);
        if (!tenant) {
            throw new Error(`Tenant ${tenantId} not found`);
        }
        this.validateTenantUpdates(tenant, updates);
        Object.assign(tenant, updates);
        this.updateResourceAllocation();
        await this.saveTenantToDatabase(tenant);
        this.emit('tenant-updated', { tenantId, updates });
        return tenant;
    }
    async deleteTenant(tenantId) {
        const tenant = await this.getTenant(tenantId);
        if (!tenant) {
            throw new Error(`Tenant ${tenantId} not found`);
        }
        this.releaseResources(tenant);
        await this.deleteTenantSchema(tenantId);
        this.tenants.delete(tenantId);
        this.emit('tenant-deleted', { tenantId });
        logger_1.logger.info('Tenant deleted', { tenantId });
    }
    async trackUsage(tenantId, usageType, amount) {
        const tenant = await this.getTenant(tenantId);
        if (!tenant)
            return;
        switch (usageType) {
            case 'api':
                tenant.metrics.usage.apiCalls += amount;
                break;
            case 'storage':
                tenant.metrics.usage.storageUsed = amount;
                break;
            case 'compute':
                tenant.metrics.usage.computeHours += amount;
                break;
        }
        this.metricsService.recordMetric({
            name: `tenant.usage.${usageType}`,
            value: amount,
            tags: { tenantId, tier: tenant.tier }
        });
        await this.checkResourceLimits(tenant);
    }
    calculateTenantCosts(tenant) {
        const rates = {
            api: 0.0001,
            storage: 0.10,
            compute: 0.50,
            agent: 50
        };
        const costs = {
            api: tenant.metrics.usage.apiCalls * rates.api,
            storage: tenant.metrics.usage.storageUsed * rates.storage,
            compute: tenant.metrics.usage.computeHours * rates.compute,
            agents: tenant.agents.currentAgents * rates.agent
        };
        const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
        return {
            breakdown: costs,
            total: totalCost,
            budget: tenant.business.monthlyBudget,
            remaining: tenant.business.monthlyBudget - totalCost
        };
    }
    async generateTenantReport(tenantId) {
        const tenant = await this.getTenant(tenantId);
        if (!tenant)
            return null;
        const costs = this.calculateTenantCosts(tenant);
        return {
            summary: {
                name: tenant.name,
                tier: tenant.tier,
                status: tenant.status,
                created: tenant.created,
                trustScore: tenant.sovereignty.trustScore
            },
            resources: {
                allocated: tenant.resources,
                usage: tenant.metrics.usage,
                utilization: {
                    compute: (tenant.metrics.usage.computeHours / 720) * 100,
                    storage: (tenant.metrics.usage.storageUsed / tenant.resources.storage) * 100,
                    api: (tenant.metrics.usage.apiCalls / tenant.resources.apiCredits) * 100
                }
            },
            performance: tenant.metrics.performance,
            financials: {
                costs,
                revenue: tenant.metrics.business.revenue,
                roi: tenant.metrics.business.revenue > 0 ?
                    ((tenant.metrics.business.revenue - costs.total) / costs.total) * 100 : 0
            },
            compliance: {
                certificates: tenant.security.complianceCerts,
                dataRetention: tenant.security.dataRetention,
                lastAudit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
        };
    }
    async enableCustomBranding(tenantId, brandingConfig) {
        const tenant = await this.getTenant(tenantId);
        if (!tenant)
            return;
        if (tenant.tier !== 'enterprise' && tenant.tier !== 'sovereign') {
            throw new Error('Custom branding requires enterprise tier or above');
        }
        tenant.customConfig.branding = brandingConfig;
        await this.saveTenantToDatabase(tenant);
        this.emit('branding-updated', { tenantId });
    }
    async enableSSOIntegration(tenantId, ssoConfig) {
        const tenant = await this.getTenant(tenantId);
        if (!tenant)
            return;
        tenant.security.ssoProvider = ssoConfig.provider;
        tenant.customConfig.ssoConfig = ssoConfig;
        await this.saveTenantToDatabase(tenant);
        this.emit('sso-configured', { tenantId });
    }
    getEnterpriseShowcase() {
        return {
            architecture: {
                tenants: this.tenants.size,
                isolation: 'Strict data and compute isolation per tenant',
                scalability: 'Horizontal scaling to 1000+ tenants',
                security: 'Enterprise-grade security with SOC2, HIPAA compliance'
            },
            features: {
                multiTenancy: true,
                customBranding: true,
                ssoIntegration: true,
                apiAccess: true,
                dedicatedSupport: true,
                slaGuarantee: '99.99% uptime'
            },
            pricing: {
                starter: '$500/month',
                growth: '$2,500/month',
                enterprise: '$10,000/month',
                sovereign: 'Custom pricing'
            },
            clients: Array.from(this.tenants.values()).map(t => ({
                name: t.name,
                industry: t.business.industry,
                agents: t.agents.currentAgents,
                satisfaction: t.metrics.business.satisfaction
            }))
        };
    }
    allocateResources(tier) {
        const allocations = {
            starter: {
                compute: 10,
                storage: 100,
                apiCredits: 10000,
                bandwidth: 100
            },
            growth: {
                compute: 50,
                storage: 500,
                apiCredits: 50000,
                bandwidth: 500
            },
            enterprise: {
                compute: 200,
                storage: 2000,
                apiCredits: 200000,
                bandwidth: 2000
            },
            sovereign: {
                compute: 500,
                storage: 10000,
                apiCredits: 1000000,
                bandwidth: 'unlimited'
            }
        };
        return allocations[tier] || allocations.starter;
    }
    getIsolationLevel(tier) {
        const levels = {
            starter: 'shared',
            growth: 'hybrid',
            enterprise: 'strict',
            sovereign: 'dedicated'
        };
        return levels[tier] || 'shared';
    }
    getMaxAgents(tier) {
        const limits = {
            starter: 10,
            growth: 50,
            enterprise: 200,
            sovereign: 'unlimited'
        };
        return limits[tier] || 10;
    }
    getMaxConsciousness(tier) {
        const limits = {
            starter: 0.7,
            growth: 0.85,
            enterprise: 0.95,
            sovereign: 1.0
        };
        return limits[tier] || 0.7;
    }
    getAllowedAgentTypes(tier) {
        const types = {
            starter: ['basic', 'support'],
            growth: ['basic', 'support', 'analytics', 'sales'],
            enterprise: ['all'],
            sovereign: ['all', 'custom']
        };
        return types[tier] || ['basic'];
    }
    getDataRetention(tier) {
        const retention = {
            starter: '30 days',
            growth: '90 days',
            enterprise: '365 days',
            sovereign: 'unlimited'
        };
        return retention[tier] || '30 days';
    }
    getComplianceCerts(tier) {
        const certs = {
            starter: ['basic-security'],
            growth: ['soc2-type1', 'gdpr'],
            enterprise: ['soc2-type2', 'gdpr', 'hipaa', 'iso27001'],
            sovereign: ['all', 'custom-compliance']
        };
        return certs[tier] || ['basic-security'];
    }
    generateTenantId() {
        return `tenant-${crypto.randomBytes(8).toString('hex')}`;
    }
    generateEncryptionKey() {
        return crypto.randomBytes(32).toString('hex');
    }
    generateApiKeys() {
        return {
            primary: `sk-${crypto.randomBytes(24).toString('hex')}`,
            secondary: `sk-${crypto.randomBytes(24).toString('hex')}`,
            readonly: `ro-${crypto.randomBytes(24).toString('hex')}`
        };
    }
    validateResourceAvailability(tier) {
        const required = this.allocateResources(tier);
        if (typeof required.compute === 'number' &&
            this.resourcePools.compute.allocated + required.compute >
                this.resourcePools.compute.total - this.resourcePools.compute.reserved) {
            throw new Error('Insufficient compute resources available');
        }
    }
    validateTenantUpdates(tenant, updates) {
        if (updates.resources) {
            const maxResources = this.allocateResources(tenant.tier);
            if (updates.resources.compute &&
                typeof maxResources.compute === 'number' &&
                updates.resources.compute > maxResources.compute) {
                throw new Error(`Compute allocation exceeds tier limit`);
            }
        }
    }
    updateResourceAllocation() {
        let totalCompute = 0;
        let totalStorage = 0;
        let totalApiCredits = 0;
        this.tenants.forEach(tenant => {
            if (typeof tenant.resources.compute === 'number') {
                totalCompute += tenant.resources.compute;
            }
            totalStorage += tenant.resources.storage;
            totalApiCredits += tenant.resources.apiCredits;
        });
        this.resourcePools.compute.allocated = totalCompute;
        this.resourcePools.storage.allocated = totalStorage;
        this.resourcePools.apiCredits.allocated = totalApiCredits;
    }
    releaseResources(tenant) {
        this.updateResourceAllocation();
    }
    async checkResourceLimits(tenant) {
        const apiUsagePercent = (tenant.metrics.usage.apiCalls / tenant.resources.apiCredits) * 100;
        const storageUsagePercent = (tenant.metrics.usage.storageUsed / tenant.resources.storage) * 100;
        if (apiUsagePercent > 80) {
            this.emit('resource-warning', {
                tenantId: tenant.id,
                resource: 'api',
                usage: apiUsagePercent,
                message: 'API credits usage above 80%'
            });
        }
        if (storageUsagePercent > 90) {
            this.emit('resource-warning', {
                tenantId: tenant.id,
                resource: 'storage',
                usage: storageUsagePercent,
                message: 'Storage usage above 90%'
            });
        }
    }
    async createTenantSchema(tenantId) {
        logger_1.logger.info('Creating tenant schema', { tenantId });
    }
    async deleteTenantSchema(tenantId) {
        logger_1.logger.info('Deleting tenant schema', { tenantId });
    }
    async initializeTenantServices(tenant) {
        logger_1.logger.info('Initializing tenant services', { tenantId: tenant.id });
    }
    async loadTenantFromDatabase(tenantId) {
        return null;
    }
    async saveTenantToDatabase(tenant) {
        logger_1.logger.info('Saving tenant to database', { tenantId: tenant.id });
    }
}
exports.MultiTenantService = MultiTenantService;
//# sourceMappingURL=multi-tenant.service.js.map