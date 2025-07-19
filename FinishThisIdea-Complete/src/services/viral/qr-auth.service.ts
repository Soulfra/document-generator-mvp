import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import crypto from 'crypto';

// Redis import with fallback
let redis: any = null;
try {
  const { createClient } = require('redis');
  redis = { createClient };
} catch (error) {
  logger.warn('Redis not available, QR codes will use in-memory storage', { error: error.message });
}

interface QRCodeData {
  uuid: string;
  sessionId: string;
  created_at: string;
  expires_at: string;
  used?: boolean;
  used_at?: string;
  used_by?: string;
  metadata?: any;
}

class QRAuthService {
  private redis: any;
  private qrCodeExpiry: number;
  private baseUrl: string;
  private inMemoryStore: Map<string, QRCodeData>;

  constructor() {
    this.qrCodeExpiry = 600; // 10 minutes
    this.baseUrl = process.env.QR_AUTH_BASE_URL || 'http://localhost:3002/qr-login';
    this.inMemoryStore = new Map();
    this.initRedis();
  }

  private async initRedis() {
    if (!redis) {
      logger.info('Using in-memory QR code storage (Redis not available)');
      return;
    }

    try {
      this.redis = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6380'
      });
      
      this.redis.on('error', (err: any) => {
        logger.error('Redis Client Error', err);
      });
      
      await this.redis.connect();
      logger.info('QR Auth Service connected to Redis');
    } catch (error) {
      logger.error('Failed to connect to Redis for QR Auth, using in-memory storage', { error });
      this.redis = null;
    }
  }

  /**
   * Generate QR code for user authentication/onboarding
   */
  async generateQRCode(sessionId: string, metadata: any = {}): Promise<any> {
    try {
      const uuid = `qr-${uuidv4()}`;
      const timestamp = new Date().toISOString();
      
      // Create QR payload with FinishThisIdea-specific data
      const qrPayload: QRCodeData = {
        uuid,
        sessionId,
        created_at: timestamp,
        expires_at: new Date(Date.now() + this.qrCodeExpiry * 1000).toISOString(),
        metadata: {
          ...metadata,
          platform: 'FinishThisIdea',
          version: '2.0.0',
          action: 'auth_or_upload'
        }
      };

      // Store in Redis or in-memory with expiry
      if (this.redis) {
        await this.redis.setEx(
          `qr:${uuid}`,
          this.qrCodeExpiry,
          JSON.stringify(qrPayload)
        );
      } else {
        // Store in memory with cleanup timer
        this.inMemoryStore.set(uuid, qrPayload);
        setTimeout(() => {
          this.inMemoryStore.delete(uuid);
        }, this.qrCodeExpiry * 1000);
      }

      // Generate QR code URL
      const qrUrl = `${this.baseUrl}?uuid=${uuid}`;
      
      // Generate QR code image (base64)
      const qrCodeImage = await QRCode.toDataURL(qrUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#667eea',
          light: '#FFFFFF'
        },
        width: 256
      });

      // Generate QR code SVG for scalability
      const qrCodeSvg = await QRCode.toString(qrUrl, {
        errorCorrectionLevel: 'M',
        type: 'svg',
        width: 256
      });

      logger.info('QR auth code generated successfully', { uuid, sessionId });

      return {
        uuid,
        url: qrUrl,
        image: qrCodeImage,
        svg: qrCodeSvg,
        expires_at: qrPayload.expires_at,
        sessionId,
        metadata: qrPayload.metadata
      };
    } catch (error) {
      logger.error('Error generating QR auth code', { error });
      throw new Error('Failed to generate QR authentication code');
    }
  }

  /**
   * Validate and process QR code scan
   */
  async validateQRCode(uuid: string): Promise<QRCodeData | null> {
    try {
      if (!this.redis) {
        throw new Error('Redis not available');
      }

      const qrData = await this.redis.get(`qr:${uuid}`);
      
      if (!qrData) {
        logger.warn('Invalid or expired QR code', { uuid });
        return null;
      }

      const parsedData: QRCodeData = JSON.parse(qrData);
      
      // Check if QR code has expired
      if (new Date(parsedData.expires_at) < new Date()) {
        logger.warn('QR code has expired', { uuid });
        await this.redis.del(`qr:${uuid}`);
        return null;
      }

      return parsedData;
    } catch (error) {
      logger.error('Error validating QR code', { error });
      throw new Error('Failed to validate QR code');
    }
  }

  /**
   * Complete QR authentication - create user session
   */
  async completeQRAuth(uuid: string, userInfo: any = {}): Promise<any> {
    try {
      const qrData = await this.validateQRCode(uuid);
      
      if (!qrData) {
        throw new Error('Invalid or expired QR code');
      }

      if (qrData.used) {
        throw new Error('QR code has already been used');
      }

      // Generate secure user ID if not provided
      const userId = userInfo.userId || this.generateSecureUserId();
      
      // Mark QR as used
      qrData.used = true;
      qrData.used_at = new Date().toISOString();
      qrData.used_by = userId;

      // Save updated QR data
      if (this.redis) {
        await this.redis.setEx(
          `qr:${uuid}`,
          3600, // Keep for 1 hour after use for audit
          JSON.stringify(qrData)
        );
      }

      // Create user session/profile if it doesn't exist
      let user = await prisma.user.findUnique({
        where: { id: userId }
      }).catch(() => null);

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userId,
            email: userInfo.email || null,
            name: userInfo.name || `User_${userId.slice(-8)}`,
            qrAuthEnabled: true,
            metadata: {
              onboardedViaQR: true,
              qrUuid: uuid,
              ...userInfo
            }
          }
        }).catch((error) => {
          // If User table doesn't exist, create a simple session record
          logger.warn('User table not found, using session-based auth', { error: error.message });
          return {
            id: userId,
            name: userInfo.name || `User_${userId.slice(-8)}`,
            qrAuthEnabled: true
          };
        });
      }

      logger.info('QR authentication completed', { uuid, userId });

      return {
        success: true,
        user,
        sessionId: qrData.sessionId,
        authToken: this.generateAuthToken(userId),
        onboarding: !user.email // Trigger onboarding if no email
      };
    } catch (error) {
      logger.error('Error completing QR authentication', { error });
      throw error;
    }
  }

  /**
   * Generate QR code specifically for file sharing/project collaboration
   */
  async generateProjectShareQR(projectId: string, uploadId: string, permissions: string[] = []): Promise<any> {
    const metadata = {
      type: 'project_share',
      projectId,
      uploadId,
      permissions: permissions.length > 0 ? permissions : ['view', 'download'],
      shareable: true
    };

    return this.generateQRCode(`project-${projectId}`, metadata);
  }

  /**
   * Generate QR code for referral/viral sharing
   */
  async generateReferralQR(referrerId: string, incentive?: string): Promise<any> {
    const metadata = {
      type: 'referral',
      referrerId,
      incentive: incentive || 'free_premium_service',
      reward: 'both_get_credit'
    };

    return this.generateQRCode(`referral-${referrerId}`, metadata);
  }

  /**
   * Generate QR code for AI Laboratory session joining
   */
  async generateLabSessionQR(sessionId: string, profiles: string[] = [], storyMode: boolean = false): Promise<any> {
    const metadata = {
      type: 'lab_session',
      sessionId,
      profiles,
      storyMode,
      experimentType: 'prompt_testing',
      allowFeedback: true,
      multiProfile: profiles.length > 1
    };

    const qrUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/ai-prompt-laboratory.html?session=${sessionId}`;
    
    // Override base URL for laboratory sessions
    const originalBaseUrl = this.baseUrl;
    this.baseUrl = qrUrl;
    
    const result = await this.generateQRCode(`lab-${sessionId}`, metadata);
    
    // Restore original base URL
    this.baseUrl = originalBaseUrl;
    
    return {
      ...result,
      url: qrUrl,
      labMetadata: metadata
    };
  }

  /**
   * Generate QR code for offline-to-online sync workflows
   */
  async generateOfflineSyncQR(userId: string, syncData: any = {}): Promise<any> {
    const metadata = {
      type: 'offline_sync',
      userId,
      syncData,
      compressionLevel: 'high',
      conflictResolution: 'merge',
      batchSync: true
    };

    return this.generateQRCode(`sync-${userId}`, metadata);
  }

  /**
   * Generate QR code for story mode activation
   */
  async generateStoryModeQR(sessionId: string, storyPreferences: any = {}): Promise<any> {
    const metadata = {
      type: 'story_mode',
      sessionId,
      storyPreferences: {
        style: storyPreferences.style || 'adventure',
        complexity: storyPreferences.complexity || 'intermediate',
        characters: storyPreferences.characters || [],
        domain: storyPreferences.domain || 'general',
        ...storyPreferences
      },
      narrativeEnhancement: true,
      characterMapping: true
    };

    return this.generateQRCode(`story-${sessionId}`, metadata);
  }

  /**
   * Generate QR code for AI team collaboration
   */
  async generateTeamCollabQR(teamId: string, permissions: string[] = [], aiProfiles: string[] = []): Promise<any> {
    const metadata = {
      type: 'team_collab',
      teamId,
      permissions: permissions.length > 0 ? permissions : ['view', 'comment', 'vote'],
      aiProfiles,
      swipeEnabled: true,
      realTimeSync: true,
      orchestratedBy: 'ai-conductor'
    };

    return this.generateQRCode(`team-${teamId}`, metadata);
  }

  private generateSecureUserId(): string {
    return `user_${crypto.randomBytes(8).toString('hex')}`;
  }

  private generateAuthToken(userId: string): string {
    return crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'finishthisidea-secret')
      .update(`${userId}-${Date.now()}`)
      .digest('hex');
  }

  /**
   * Get QR authentication statistics
   */
  async getQRStats(): Promise<any> {
    try {
      if (!this.redis) {
        return { error: 'Redis not available' };
      }

      const keys = await this.redis.keys('qr:*');
      const stats = {
        total: keys.length,
        active: 0,
        used: 0,
        expired: 0,
        project_shares: 0,
        referrals: 0,
        lab_sessions: 0,
        offline_syncs: 0,
        story_modes: 0,
        team_collabs: 0
      };

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const qrData: QRCodeData = JSON.parse(data);
          if (qrData.used) {
            stats.used++;
          } else if (new Date(qrData.expires_at) < new Date()) {
            stats.expired++;
          } else {
            stats.active++;
          }

          // Count special types
          if (qrData.metadata?.type === 'project_share') {
            stats.project_shares++;
          } else if (qrData.metadata?.type === 'referral') {
            stats.referrals++;
          } else if (qrData.metadata?.type === 'lab_session') {
            stats.lab_sessions++;
          } else if (qrData.metadata?.type === 'offline_sync') {
            stats.offline_syncs++;
          } else if (qrData.metadata?.type === 'story_mode') {
            stats.story_modes++;
          } else if (qrData.metadata?.type === 'team_collab') {
            stats.team_collabs++;
          }
        }
      }

      return stats;
    } catch (error) {
      logger.error('Error getting QR stats', { error });
      return { error: 'Failed to get QR statistics' };
    }
  }

  /**
   * Cleanup expired QR codes
   */
  async cleanupExpiredQRCodes(): Promise<number> {
    try {
      if (!this.redis) {
        return 0;
      }

      const keys = await this.redis.keys('qr:*');
      let cleaned = 0;

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const qrData: QRCodeData = JSON.parse(data);
          if (new Date(qrData.expires_at) < new Date() && !qrData.used) {
            await this.redis.del(key);
            cleaned++;
          }
        }
      }

      logger.info(`Cleaned up ${cleaned} expired QR codes`);
      return cleaned;
    } catch (error) {
      logger.error('Error cleaning up QR codes', { error });
      return 0;
    }
  }
}

export const qrAuthService = new QRAuthService();