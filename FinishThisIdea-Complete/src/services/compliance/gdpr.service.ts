/**
 * GDPR/CCPA Compliance Service
 * Provides comprehensive privacy compliance features including consent management,
 * data rights APIs, and automated data retention policies
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/database';
import { redis } from '../../config/redis';
import { logger } from '../../utils/logger';
import { prometheusMetrics } from '../monitoring/prometheus-metrics.service';
import crypto from 'crypto';
import { Readable } from 'stream';

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  purpose: string;
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  expiresAt?: Date;
  withdrawnAt?: Date;
  version: string;
}

export interface DataExportRequest {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
}

export interface DataDeletionRequest {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: Date;
  completedAt?: Date;
  anonymizationLevel: 'partial' | 'full';
  retainedData: string[];
}

export type ConsentType = 
  | 'essential'          // Required for basic functionality
  | 'analytics'          // User behavior analytics
  | 'marketing'          // Marketing communications
  | 'personalization'    // Personalized experience
  | 'third_party'        // Third-party integrations
  | 'ai_training'        // AI model training
  | 'data_sharing'       // Data sharing with partners
  | 'location'           // Location data
  | 'cookies_functional' // Functional cookies
  | 'cookies_analytics'  // Analytics cookies
  | 'cookies_marketing'; // Marketing cookies

export interface ComplianceConfig {
  consentVersion: string;
  dataRetentionDays: number;
  anonymizationDelayDays: number;
  exportExpirationDays: number;
  enableConsentBanners: boolean;
  enableDataMinimization: boolean;
  enableAutomaticDeletion: boolean;
  requiredConsents: ConsentType[];
  optionalConsents: ConsentType[];
}

const defaultConfig: ComplianceConfig = {
  consentVersion: '1.0',
  dataRetentionDays: 365 * 2, // 2 years
  anonymizationDelayDays: 30, // 30 days after deletion request
  exportExpirationDays: 7, // Export links expire after 7 days
  enableConsentBanners: true,
  enableDataMinimization: true,
  enableAutomaticDeletion: true,
  requiredConsents: ['essential'],
  optionalConsents: ['analytics', 'marketing', 'personalization', 'cookies_analytics']
};

export class GDPRComplianceService {
  private static instance: GDPRComplianceService;
  private config: ComplianceConfig;

  constructor(config: Partial<ComplianceConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  public static getInstance(config?: Partial<ComplianceConfig>): GDPRComplianceService {
    if (!GDPRComplianceService.instance) {
      GDPRComplianceService.instance = new GDPRComplianceService(config);
    }
    return GDPRComplianceService.instance;
  }

  /**
   * Record user consent
   */
  public async recordConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
    purpose: string,
    req: Request
  ): Promise<ConsentRecord> {
    const start = Date.now();

    try {
      const consent: ConsentRecord = {
        id: crypto.randomUUID(),
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

      // Store in database
      await prisma.userConsent.create({
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

      // Cache current consent status
      const cacheKey = `consent:${userId}:${consentType}`;
      await redis.setex(cacheKey, 3600, JSON.stringify({
        granted,
        timestamp: consent.timestamp,
        expiresAt: consent.expiresAt
      }));

      logger.info('Consent recorded', {
        userId,
        consentType,
        granted,
        purpose,
        ipAddress: consent.ipAddress
      });

      prometheusMetrics.functionDuration.observe(
        { name: 'gdpr_record_consent' },
        Date.now() - start
      );

      return consent;

    } catch (error) {
      logger.error('Failed to record consent', error);
      prometheusMetrics.functionErrors.inc({ name: 'gdpr_record_consent_error' });
      throw error;
    }
  }

  /**
   * Get user consent status
   */
  public async getUserConsent(userId: string, consentType?: ConsentType): Promise<ConsentRecord[]> {
    const start = Date.now();

    try {
      const where: any = { userId };
      if (consentType) {
        where.consentType = consentType;
      }

      const consents = await prisma.userConsent.findMany({
        where,
        orderBy: { timestamp: 'desc' }
      });

      prometheusMetrics.functionDuration.observe(
        { name: 'gdpr_get_consent' },
        Date.now() - start
      );

      return consents as ConsentRecord[];

    } catch (error) {
      logger.error('Failed to get user consent', error);
      prometheusMetrics.functionErrors.inc({ name: 'gdpr_get_consent_error' });
      throw error;
    }
  }

  /**
   * Withdraw consent
   */
  public async withdrawConsent(
    userId: string,
    consentType: ConsentType,
    req: Request
  ): Promise<void> {
    const start = Date.now();

    try {
      // Record withdrawal
      await this.recordConsent(userId, consentType, false, 'User withdrawal', req);

      // Update cache
      const cacheKey = `consent:${userId}:${consentType}`;
      await redis.del(cacheKey);

      // Trigger data cleanup if necessary
      if (consentType === 'analytics') {
        await this.cleanupAnalyticsData(userId);
      }

      logger.info('Consent withdrawn', { userId, consentType });

      prometheusMetrics.functionDuration.observe(
        { name: 'gdpr_withdraw_consent' },
        Date.now() - start
      );

    } catch (error) {
      logger.error('Failed to withdraw consent', error);
      prometheusMetrics.functionErrors.inc({ name: 'gdpr_withdraw_consent_error' });
      throw error;
    }
  }

  /**
   * Check if user has valid consent for a specific purpose
   */
  public async hasValidConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    const start = Date.now();

    try {
      // Check cache first
      const cacheKey = `consent:${userId}:${consentType}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        const consent = JSON.parse(cached);
        const isExpired = consent.expiresAt && new Date(consent.expiresAt) < new Date();
        
        prometheusMetrics.functionDuration.observe(
          { name: 'gdpr_check_consent_cached' },
          Date.now() - start
        );

        return consent.granted && !isExpired;
      }

      // Check database
      const latestConsent = await prisma.userConsent.findFirst({
        where: {
          userId,
          consentType
        },
        orderBy: { timestamp: 'desc' }
      });

      if (!latestConsent) {
        prometheusMetrics.functionDuration.observe(
          { name: 'gdpr_check_consent_db' },
          Date.now() - start
        );
        return false;
      }

      const isExpired = latestConsent.expiresAt && latestConsent.expiresAt < new Date();
      const hasConsent = latestConsent.granted && !isExpired;

      // Update cache
      await redis.setex(cacheKey, 3600, JSON.stringify({
        granted: latestConsent.granted,
        timestamp: latestConsent.timestamp,
        expiresAt: latestConsent.expiresAt
      }));

      prometheusMetrics.functionDuration.observe(
        { name: 'gdpr_check_consent_db' },
        Date.now() - start
      );

      return hasConsent;

    } catch (error) {
      logger.error('Failed to check consent', error);
      prometheusMetrics.functionErrors.inc({ name: 'gdpr_check_consent_error' });
      return false;
    }
  }

  /**
   * Create data export request
   */
  public async createDataExportRequest(userId: string): Promise<DataExportRequest> {
    const start = Date.now();

    try {
      const exportRequest: DataExportRequest = {
        id: crypto.randomUUID(),
        userId,
        status: 'pending',
        requestedAt: new Date()
      };

      await prisma.dataExportRequest.create({
        data: exportRequest
      });

      // Queue export processing
      await this.queueDataExport(exportRequest);

      logger.info('Data export request created', { userId, requestId: exportRequest.id });

      prometheusMetrics.functionDuration.observe(
        { name: 'gdpr_create_export_request' },
        Date.now() - start
      );

      return exportRequest;

    } catch (error) {
      logger.error('Failed to create data export request', error);
      prometheusMetrics.functionErrors.inc({ name: 'gdpr_create_export_error' });
      throw error;
    }
  }

  /**
   * Process data export request
   */
  public async processDataExport(requestId: string): Promise<void> {
    const start = Date.now();

    try {
      const request = await prisma.dataExportRequest.findUnique({
        where: { id: requestId }
      });

      if (!request) {
        throw new Error('Export request not found');
      }

      // Update status to processing
      await prisma.dataExportRequest.update({
        where: { id: requestId },
        data: { status: 'processing' }
      });

      // Collect user data
      const userData = await this.collectUserData(request.userId);

      // Generate export file
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

      // Store export file (implement your preferred storage method)
      const downloadUrl = await this.storeExportFile(requestId, exportData);
      const expiresAt = new Date(Date.now() + this.config.exportExpirationDays * 24 * 60 * 60 * 1000);

      // Update request with download URL
      await prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          downloadUrl,
          expiresAt
        }
      });

      logger.info('Data export completed', { userId: request.userId, requestId });

      prometheusMetrics.functionDuration.observe(
        { name: 'gdpr_process_export' },
        Date.now() - start
      );

    } catch (error) {
      logger.error('Failed to process data export', error);
      prometheusMetrics.functionErrors.inc({ name: 'gdpr_process_export_error' });

      // Update request status to failed
      await prisma.dataExportRequest.update({
        where: { id: requestId },
        data: { status: 'failed' }
      });

      throw error;
    }
  }

  /**
   * Create data deletion request
   */
  public async createDataDeletionRequest(
    userId: string,
    anonymizationLevel: 'partial' | 'full' = 'partial'
  ): Promise<DataDeletionRequest> {
    const start = Date.now();

    try {
      const deletionRequest: DataDeletionRequest = {
        id: crypto.randomUUID(),
        userId,
        status: 'pending',
        requestedAt: new Date(),
        anonymizationLevel,
        retainedData: this.getRetainedDataFields(anonymizationLevel)
      };

      await prisma.dataDeletionRequest.create({
        data: deletionRequest
      });

      // Schedule deletion after legal waiting period
      await this.scheduleDeletion(deletionRequest);

      logger.info('Data deletion request created', {
        userId,
        requestId: deletionRequest.id,
        anonymizationLevel
      });

      prometheusMetrics.functionDuration.observe(
        { name: 'gdpr_create_deletion_request' },
        Date.now() - start
      );

      return deletionRequest;

    } catch (error) {
      logger.error('Failed to create data deletion request', error);
      prometheusMetrics.functionErrors.inc({ name: 'gdpr_create_deletion_error' });
      throw error;
    }
  }

  /**
   * Consent middleware for Express routes
   */
  public consentMiddleware(requiredConsents: ConsentType[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();

      try {
        const userId = (req as any).user?.id;

        if (!userId) {
          return next(); // Skip if not authenticated
        }

        // Check all required consents
        const consentChecks = await Promise.all(
          requiredConsents.map(consent => this.hasValidConsent(userId, consent))
        );

        const missingConsents = requiredConsents.filter((_, index) => !consentChecks[index]);

        if (missingConsents.length > 0) {
          logger.warn('Missing required consents', {
            userId,
            missingConsents,
            path: req.path
          });

          prometheusMetrics.functionErrors.inc({ name: 'gdpr_missing_consent' });

          return res.status(403).json({
            success: false,
            error: {
              code: 'CONSENT_REQUIRED',
              message: 'Required consents not granted',
              missingConsents
            }
          });
        }

        prometheusMetrics.functionDuration.observe(
          { name: 'gdpr_consent_middleware' },
          Date.now() - start
        );

        next();

      } catch (error) {
        logger.error('Consent middleware error', error);
        prometheusMetrics.functionErrors.inc({ name: 'gdpr_consent_middleware_error' });
        next(); // Continue on error to avoid breaking functionality
      }
    };
  }

  /**
   * Private helper methods
   */
  private calculateConsentExpiry(consentType: ConsentType): Date | undefined {
    // Essential consents don't expire
    if (consentType === 'essential') {
      return undefined;
    }

    // Other consents expire after 1 year (GDPR requirement)
    return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  }

  private async queueDataExport(request: DataExportRequest): Promise<void> {
    // Queue for background processing
    await redis.lpush('data_export_queue', JSON.stringify(request));
  }

  private async collectUserData(userId: string): Promise<any> {
    const [user, jobs, payments, consents] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.job.findMany({ where: { userId } }),
      prisma.payment.findMany({ where: { userId } }),
      prisma.userConsent.findMany({ where: { userId } })
    ]);

    return {
      personal: user,
      activity: { jobs, payments },
      consents,
      preferences: {} // Add user preferences if available
    };
  }

  private async storeExportFile(requestId: string, data: any): Promise<string> {
    // Implement your storage solution (S3, local filesystem, etc.)
    // For now, return a placeholder URL
    return `https://exports.finishthisidea.com/download/${requestId}`;
  }

  private getRetainedDataFields(level: 'partial' | 'full'): string[] {
    if (level === 'full') {
      return []; // Delete everything possible
    }

    return [
      'aggregated_analytics', // Anonymized analytics
      'transaction_records',  // Legal requirement
      'audit_logs'           // Security requirement
    ];
  }

  private async scheduleDeletion(request: DataDeletionRequest): Promise<void> {
    const deleteAt = new Date(
      request.requestedAt.getTime() + this.config.anonymizationDelayDays * 24 * 60 * 60 * 1000
    );

    // Schedule deletion job
    await redis.zadd(
      'scheduled_deletions',
      deleteAt.getTime(),
      JSON.stringify(request)
    );
  }

  private async cleanupAnalyticsData(userId: string): Promise<void> {
    // Remove analytics data for user who withdrew analytics consent
    logger.info('Cleaning up analytics data for user', { userId });
    // Implement analytics data cleanup
  }

  /**
   * Get pending export request for user
   */
  public async getPendingExportRequest(userId: string): Promise<DataExportRequest | null> {
    try {
      const request = await prisma.dataExportRequest.findFirst({
        where: {
          userId,
          status: {
            in: ['pending', 'processing']
          }
        },
        orderBy: { requestedAt: 'desc' }
      });

      return request as DataExportRequest | null;

    } catch (error) {
      logger.error('Failed to get pending export request', error);
      return null;
    }
  }

  /**
   * Get user export requests
   */
  public async getUserExportRequests(userId: string): Promise<DataExportRequest[]> {
    try {
      const requests = await prisma.dataExportRequest.findMany({
        where: { userId },
        orderBy: { requestedAt: 'desc' }
      });

      return requests as DataExportRequest[];

    } catch (error) {
      logger.error('Failed to get user export requests', error);
      return [];
    }
  }

  /**
   * Get specific export request
   */
  public async getExportRequest(requestId: string): Promise<DataExportRequest | null> {
    try {
      const request = await prisma.dataExportRequest.findUnique({
        where: { id: requestId }
      });

      return request as DataExportRequest | null;

    } catch (error) {
      logger.error('Failed to get export request', error);
      return null;
    }
  }

  /**
   * Generate secure download URL
   */
  public async generateSecureDownloadUrl(requestId: string, userId: string): Promise<string> {
    // Create a temporary signed URL
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store the token in Redis with TTL
    await redis.setex(`download:${token}`, 86400, JSON.stringify({
      requestId,
      userId,
      expiresAt
    }));

    return `${process.env.BACKEND_URL}/api/privacy/download/${token}`;
  }

  /**
   * Get pending deletion request for user
   */
  public async getPendingDeletionRequest(userId: string): Promise<DataDeletionRequest | null> {
    try {
      const request = await prisma.dataDeletionRequest.findFirst({
        where: {
          userId,
          status: {
            in: ['pending', 'processing']
          }
        },
        orderBy: { requestedAt: 'desc' }
      });

      return request as DataDeletionRequest | null;

    } catch (error) {
      logger.error('Failed to get pending deletion request', error);
      return null;
    }
  }

  /**
   * Get user deletion requests
   */
  public async getUserDeletionRequests(userId: string): Promise<DataDeletionRequest[]> {
    try {
      const requests = await prisma.dataDeletionRequest.findMany({
        where: { userId },
        orderBy: { requestedAt: 'desc' }
      });

      return requests as DataDeletionRequest[];

    } catch (error) {
      logger.error('Failed to get user deletion requests', error);
      return [];
    }
  }

  /**
   * Cancel deletion request
   */
  public async cancelDeletionRequest(requestId: string, userId: string): Promise<boolean> {
    try {
      const request = await prisma.dataDeletionRequest.findUnique({
        where: { id: requestId }
      });

      if (!request || request.userId !== userId || request.status !== 'pending') {
        return false;
      }

      await prisma.dataDeletionRequest.update({
        where: { id: requestId },
        data: { status: 'cancelled' }
      });

      logger.info('Deletion request cancelled', { requestId, userId });
      return true;

    } catch (error) {
      logger.error('Failed to cancel deletion request', error);
      return false;
    }
  }

  /**
   * Get user data access log
   */
  public async getUserDataAccessLog(userId: string, options: {
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{
    records: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const { page = 1, limit = 20, startDate, endDate } = options;
      const skip = (page - 1) * limit;

      const where: any = { userId };
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = startDate;
        if (endDate) where.timestamp.lte = endDate;
      }

      const [records, total] = await Promise.all([
        prisma.dataAccessLog.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          skip,
          take: limit
        }),
        prisma.dataAccessLog.count({ where })
      ]);

      return {
        records,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };

    } catch (error) {
      logger.error('Failed to get data access log', error);
      return {
        records: [],
        total: 0,
        page: 1,
        totalPages: 0
      };
    }
  }

  /**
   * Get privacy policy status
   */
  public async getPrivacyPolicyStatus(userId: string): Promise<{
    accepted: boolean;
    version: string;
    acceptedAt?: Date;
    current: boolean;
  }> {
    try {
      const acceptance = await prisma.privacyPolicyAcceptance.findFirst({
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

    } catch (error) {
      logger.error('Failed to get privacy policy status', error);
      return {
        accepted: false,
        version: 'none',
        current: false
      };
    }
  }

  /**
   * Accept privacy policy
   */
  public async acceptPrivacyPolicy(userId: string, version: string, req: Request): Promise<void> {
    try {
      await prisma.privacyPolicyAcceptance.create({
        data: {
          userId,
          version,
          acceptedAt: new Date(),
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('user-agent') || 'unknown'
        }
      });

      logger.info('Privacy policy accepted', { userId, version });

    } catch (error) {
      logger.error('Failed to accept privacy policy', error);
      throw error;
    }
  }

  /**
   * Log data access for audit trail
   */
  public async logDataAccess(
    userId: string,
    dataType: string,
    action: 'read' | 'write' | 'delete',
    details: any,
    req: Request
  ): Promise<void> {
    try {
      await prisma.dataAccessLog.create({
        data: {
          userId,
          dataType,
          action,
          details: JSON.stringify(details),
          timestamp: new Date(),
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('user-agent') || 'unknown',
          requestId: (req as any).requestId || 'unknown'
        }
      });

    } catch (error) {
      logger.error('Failed to log data access', error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  /**
   * Data access logging middleware
   */
  public dataAccessMiddleware(dataType: string, action: 'read' | 'write' | 'delete') {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = (req as any).user?.id;
        if (userId) {
          await this.logDataAccess(userId, dataType, action, {
            path: req.path,
            method: req.method,
            query: req.query,
            params: req.params
          }, req);
        }
        next();
      } catch (error) {
        logger.error('Data access middleware error', error);
        next(); // Continue on error
      }
    };
  }

  /**
   * Cleanup expired consents (for scheduled cleanup)
   */
  public async cleanupExpiredConsents(): Promise<number> {
    try {
      const expiredConsents = await prisma.userConsent.findMany({
        where: {
          expiresAt: {
            lt: new Date()
          },
          granted: true
        }
      });

      let cleanedCount = 0;

      for (const consent of expiredConsents) {
        // Mark as expired by creating a new record
        await this.recordConsent(
          consent.userId,
          consent.consentType as ConsentType,
          false,
          'Automatic expiry',
          { ip: 'system', get: () => 'system' } as any
        );

        cleanedCount++;
      }

      logger.info('Expired consents cleaned up', { cleanedCount });
      return cleanedCount;

    } catch (error) {
      logger.error('Failed to cleanup expired consents', error);
      return 0;
    }
  }
}

// Export singleton instance
export const gdprService = GDPRComplianceService.getInstance();