/**
 * Platform Licensing Service
 * Enables white-label deployments and revenue sharing
 * Adapted from Soulfra-AgentZero's licensing system
 */

import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import { logger } from '../../utils/logger';
import { PaymentService } from '../payment/payment.service';
import { MultiTenantService } from '../multi-tenant/multi-tenant.service';
import { EmailQueueService } from '../email/email-queue.service';

interface LicenseConfig {
  id: string;
  name: string;
  type: 'standard' | 'professional' | 'enterprise' | 'whitelabel';
  status: 'active' | 'suspended' | 'expired' | 'pending';
  features: string[];
  limits: {
    users?: number;
    projects?: number;
    apiCalls?: number;
    storage?: number; // GB
    customDomains?: number;
    subLicenses?: number;
  };
  billing: {
    amount: number;
    currency: string;
    interval: 'monthly' | 'yearly' | 'lifetime';
    revenueShare?: number; // Percentage for sub-licenses
  };
  branding: {
    removeBranding: boolean;
    customLogo?: string;
    customColors?: Record<string, string>;
    customDomain?: string;
    customEmails?: boolean;
  };
  tenant?: {
    tenantId: string;
    isolationLevel: 'shared' | 'dedicated';
  };
  parent?: {
    licenseId: string;
    revenueShare: number;
  };
  metadata: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
  lastActiveAt: Date;
}

interface LicenseUsage {
  licenseId: string;
  period: Date;
  metrics: {
    activeUsers: number;
    projectsCreated: number;
    apiCallsMade: number;
    storageUsed: number;
    revenue: number;
  };
}

interface RevenueShare {
  licenseId: string;
  parentLicenseId: string;
  amount: number;
  percentage: number;
  period: Date;
  status: 'pending' | 'paid' | 'failed';
  paidAt?: Date;
}

export class PlatformLicensingService extends EventEmitter {
  private prisma: PrismaClient;
  private paymentService: PaymentService;
  private multiTenantService: MultiTenantService;
  private emailQueue: EmailQueueService;
  
  private licenses: Map<string, LicenseConfig> = new Map();
  private usageTracking: Map<string, LicenseUsage> = new Map();
  private revenueShares: Map<string, RevenueShare[]> = new Map();

  constructor() {
    super();
    this.prisma = new PrismaClient();
    this.paymentService = new PaymentService();
    this.multiTenantService = new MultiTenantService();
    this.emailQueue = new EmailQueueService();
    
    this.initializeLicenseTypes();
    this.startUsageTracking();
  }

  /**
   * Initialize license types and features
   */
  private initializeLicenseTypes(): void {
    // Define license tiers
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
          users: -1, // Unlimited
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
        revenueShare: 30 // Platform gets 30%
      }
    };
  }

  /**
   * Create a new license
   */
  async createLicense(options: {
    type: string;
    name: string;
    email: string;
    company?: string;
    customization?: {
      logo?: string;
      colors?: Record<string, string>;
      domain?: string;
    };
    parentLicenseId?: string;
  }): Promise<LicenseConfig> {
    try {
      const licenseType = this.licenseTypes[options.type];
      if (!licenseType) {
        throw new Error('Invalid license type');
      }

      // Generate license key
      const licenseKey = this.generateLicenseKey(options.type);
      
      // Calculate expiry (1 year for most licenses)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // Create license configuration
      const license: LicenseConfig = {
        id: licenseKey,
        name: options.name,
        type: options.type as any,
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

      // Handle sub-licensing
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

      // Create tenant for enterprise/whitelabel
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

      // Store license
      this.licenses.set(licenseKey, license);
      
      // Save to database
      await this.saveLicense(license);

      // Send activation email
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

      logger.info('License created', {
        licenseId: licenseKey,
        type: options.type,
        company: options.company
      });

      return license;
    } catch (error) {
      logger.error('Error creating license', error);
      throw error;
    }
  }

  /**
   * Activate a license
   */
  async activateLicense(activationCode: string): Promise<LicenseConfig> {
    const license = Array.from(this.licenses.values()).find(
      l => l.metadata.activationCode === activationCode
    );

    if (!license) {
      throw new Error('Invalid activation code');
    }

    if (license.status !== 'pending') {
      throw new Error('License already activated');
    }

    // Update status
    license.status = 'active';
    license.metadata.activatedAt = new Date();

    // Process payment
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

    // Update in database
    await this.saveLicense(license);

    // Send confirmation
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

  /**
   * Validate license
   */
  async validateLicense(licenseKey: string): Promise<{
    valid: boolean;
    license?: LicenseConfig;
    reason?: string;
  }> {
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

    // Update last active
    license.lastActiveAt = new Date();
    await this.saveLicense(license);

    return { valid: true, license };
  }

  /**
   * Check license limits
   */
  async checkLimits(licenseKey: string, resource: string, amount: number = 1): Promise<{
    allowed: boolean;
    current?: number;
    limit?: number;
    reason?: string;
  }> {
    const validation = await this.validateLicense(licenseKey);
    if (!validation.valid) {
      return { allowed: false, reason: validation.reason };
    }

    const license = validation.license!;
    const usage = await this.getUsage(licenseKey);
    const limit = license.limits[resource as keyof typeof license.limits];

    if (limit === -1) {
      return { allowed: true }; // Unlimited
    }

    const current = usage.metrics[resource as keyof typeof usage.metrics] || 0;
    
    if (current + amount > limit!) {
      return {
        allowed: false,
        current,
        limit,
        reason: `${resource} limit exceeded`
      };
    }

    return { allowed: true, current, limit };
  }

  /**
   * Track usage
   */
  async trackUsage(licenseKey: string, metric: string, amount: number = 1): Promise<void> {
    const usage = await this.getUsage(licenseKey);
    
    if (!usage.metrics[metric as keyof typeof usage.metrics]) {
      usage.metrics[metric as keyof typeof usage.metrics] = 0;
    }
    
    (usage.metrics as any)[metric] += amount;
    
    this.usageTracking.set(licenseKey, usage);
    
    // Check if limits exceeded
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

  /**
   * Create sub-license (for white-label partners)
   */
  async createSubLicense(
    parentLicenseKey: string,
    options: {
      name: string;
      email: string;
      type: string;
      customPrice?: number;
    }
  ): Promise<LicenseConfig> {
    const parentLicense = await this.getLicense(parentLicenseKey);
    
    if (!parentLicense || parentLicense.type !== 'whitelabel') {
      throw new Error('Only white-label partners can create sub-licenses');
    }

    const subLicense = await this.createLicense({
      ...options,
      parentLicenseId: parentLicenseKey
    });

    // Override pricing if custom
    if (options.customPrice) {
      subLicense.billing.amount = options.customPrice;
    }

    return subLicense;
  }

  /**
   * Calculate and distribute revenue shares
   */
  async calculateRevenueShares(period: Date = new Date()): Promise<void> {
    const licenses = Array.from(this.licenses.values());
    
    for (const license of licenses) {
      if (!license.parent) continue;
      
      const usage = await this.getUsage(license.id);
      const revenue = usage.metrics.revenue || 0;
      
      if (revenue > 0) {
        const parentShare = (revenue * license.parent.revenueShare) / 100;
        const platformShare = revenue - parentShare;
        
        const revenueShare: RevenueShare = {
          licenseId: license.id,
          parentLicenseId: license.parent.licenseId,
          amount: parentShare,
          percentage: license.parent.revenueShare,
          period,
          status: 'pending'
        };
        
        // Store revenue share
        if (!this.revenueShares.has(license.parent.licenseId)) {
          this.revenueShares.set(license.parent.licenseId, []);
        }
        this.revenueShares.get(license.parent.licenseId)!.push(revenueShare);
        
        // Process payout
        await this.processRevenuePayout(revenueShare);
        
        logger.info('Revenue share calculated', {
          licenseId: license.id,
          parentLicenseId: license.parent.licenseId,
          amount: parentShare,
          platformShare
        });
      }
    }
  }

  /**
   * Process revenue payout
   */
  private async processRevenuePayout(revenueShare: RevenueShare): Promise<void> {
    try {
      const parentLicense = await this.getLicense(revenueShare.parentLicenseId);
      if (!parentLicense) return;
      
      // Create payout
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
      
      // Send notification
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
    } catch (error) {
      logger.error('Error processing revenue payout', error);
      revenueShare.status = 'failed';
    }
  }

  /**
   * Get license dashboard data
   */
  async getLicenseDashboard(licenseKey: string): Promise<{
    license: LicenseConfig;
    usage: LicenseUsage;
    subLicenses?: LicenseConfig[];
    revenueShares?: RevenueShare[];
    analytics: {
      totalRevenue: number;
      activeUsers: number;
      projectsCreated: number;
      storageUsed: number;
      apiUsage: number;
    };
  }> {
    const license = await this.getLicense(licenseKey);
    if (!license) {
      throw new Error('License not found');
    }

    const usage = await this.getUsage(licenseKey);
    
    const dashboard: any = {
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

    // Add sub-licenses for white-label partners
    if (license.type === 'whitelabel') {
      dashboard.subLicenses = Array.from(this.licenses.values()).filter(
        l => l.parent?.licenseId === licenseKey
      );
      
      dashboard.revenueShares = this.revenueShares.get(licenseKey) || [];
      
      // Calculate total revenue from sub-licenses
      dashboard.analytics.totalRevenue = dashboard.revenueShares.reduce(
        (total: number, share: RevenueShare) => total + share.amount,
        0
      );
    }

    return dashboard;
  }

  /**
   * Suspend license
   */
  async suspendLicense(licenseKey: string, reason: string): Promise<void> {
    const license = await this.getLicense(licenseKey);
    if (!license) {
      throw new Error('License not found');
    }

    license.status = 'suspended';
    license.metadata.suspendedAt = new Date();
    license.metadata.suspensionReason = reason;

    await this.saveLicense(license);

    // Notify license holder
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

  /**
   * Renew license
   */
  async renewLicense(licenseKey: string, period: number = 1): Promise<LicenseConfig> {
    const license = await this.getLicense(licenseKey);
    if (!license) {
      throw new Error('License not found');
    }

    // Process renewal payment
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

    // Extend expiry
    if (license.expiresAt) {
      license.expiresAt.setFullYear(license.expiresAt.getFullYear() + period);
    } else {
      license.expiresAt = new Date();
      license.expiresAt.setFullYear(license.expiresAt.getFullYear() + period);
    }

    license.status = 'active';
    license.metadata.lastRenewalAt = new Date();
    license.metadata.renewalPaymentId = payment.id;

    await this.saveLicense(license);

    // Send confirmation
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

  /**
   * Transfer license ownership
   */
  async transferLicense(
    licenseKey: string, 
    newOwner: {
      name: string;
      email: string;
      company?: string;
    }
  ): Promise<void> {
    const license = await this.getLicense(licenseKey);
    if (!license) {
      throw new Error('License not found');
    }

    const oldOwner = {
      name: license.name,
      email: license.metadata.email,
      company: license.metadata.company
    };

    // Update license
    license.name = newOwner.name;
    license.metadata.email = newOwner.email;
    license.metadata.company = newOwner.company;
    license.metadata.transferredAt = new Date();
    license.metadata.previousOwner = oldOwner;

    await this.saveLicense(license);

    // Notify both parties
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

  /**
   * Helper methods
   */
  private generateLicenseKey(type: string): string {
    const prefix = type.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex');
    return `${prefix}-${timestamp}-${random}`.toUpperCase();
  }

  private async getLicense(licenseKey: string): Promise<LicenseConfig | null> {
    // Check memory cache first
    let license = this.licenses.get(licenseKey);
    
    if (!license) {
      // Load from database
      license = await this.loadLicenseFromDatabase(licenseKey);
      if (license) {
        this.licenses.set(licenseKey, license);
      }
    }
    
    return license;
  }

  private async getUsage(licenseKey: string): Promise<LicenseUsage> {
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

  private async saveLicense(license: LicenseConfig): Promise<void> {
    // In production, save to database
    logger.info('Saving license', { licenseId: license.id });
  }

  private async loadLicenseFromDatabase(licenseKey: string): Promise<LicenseConfig | null> {
    // In production, load from database
    return null;
  }

  private startUsageTracking(): void {
    // Reset usage metrics monthly
    setInterval(() => {
      const now = new Date();
      if (now.getDate() === 1) {
        // Reset monthly metrics
        this.usageTracking.forEach((usage, licenseKey) => {
          usage.period = now;
          usage.metrics = {
            activeUsers: 0,
            projectsCreated: 0,
            apiCallsMade: 0,
            storageUsed: usage.metrics.storageUsed, // Keep storage
            revenue: 0
          };
        });
      }
    }, 24 * 60 * 60 * 1000); // Daily check
  }

  private licenseTypes: Record<string, any> = {};
}