/**
 * QR Code Generation Service
 * Enhanced from Soulfra-AgentZero's QR implementation
 */

import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { redis } from '../../config/redis';

interface QRCodeData {
  id: string;
  type: 'referral' | 'auth' | 'share' | 'session';
  data: any;
  expires: Date;
  metadata?: {
    userId?: string;
    source?: string;
    campaign?: string;
  };
}

interface QRCodeOptions {
  type?: QRCode.QRCodeToDataURLOptions['type'];
  quality?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  width?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export class QRService {
  private static instance: QRService;
  private readonly defaultExpiry = 24 * 60 * 60 * 1000; // 24 hours

  public static getInstance(): QRService {
    if (!QRService.instance) {
      QRService.instance = new QRService();
    }
    return QRService.instance;
  }

  /**
   * Generate QR code for referral links
   */
  async generateReferralQR(
    referralCode: string, 
    baseUrl: string = 'https://finishthisidea.com',
    options?: QRCodeOptions
  ): Promise<{ id: string; dataUrl: string; url: string }> {
    const qrId = uuidv4();
    const url = `${baseUrl}?ref=${referralCode}&qr=${qrId}`;
    
    const qrData: QRCodeData = {
      id: qrId,
      type: 'referral',
      data: {
        referralCode,
        url,
        baseUrl
      },
      expires: new Date(Date.now() + this.defaultExpiry),
      metadata: {
        source: 'qr_code',
        campaign: 'referral_sharing'
      }
    };

    // Store QR data in Redis
    await this.storeQRData(qrId, qrData);

    // Generate QR code
    const dataUrl = await this.generateQRCode(url, options);

    logger.info('Referral QR code generated', { qrId, referralCode });

    return { id: qrId, dataUrl, url };
  }

  /**
   * Generate QR code for authentication/session
   */
  async generateAuthQR(
    sessionData: any,
    expiryMinutes: number = 10
  ): Promise<{ id: string; dataUrl: string }> {
    const qrId = uuidv4();
    const expires = new Date(Date.now() + expiryMinutes * 60 * 1000);
    
    const qrData: QRCodeData = {
      id: qrId,
      type: 'auth',
      data: sessionData,
      expires,
      metadata: {
        source: 'auth_qr'
      }
    };

    await this.storeQRData(qrId, qrData);

    // For auth QR, we just encode the QR ID
    const dataUrl = await this.generateQRCode(qrId, {
      errorCorrectionLevel: 'H',
      width: 256
    });

    logger.info('Auth QR code generated', { qrId, expiryMinutes });

    return { id: qrId, dataUrl };
  }

  /**
   * Generate QR code for general sharing
   */
  async generateShareQR(
    shareUrl: string,
    metadata?: any,
    options?: QRCodeOptions
  ): Promise<{ id: string; dataUrl: string }> {
    const qrId = uuidv4();
    
    const qrData: QRCodeData = {
      id: qrId,
      type: 'share',
      data: {
        url: shareUrl,
        ...metadata
      },
      expires: new Date(Date.now() + this.defaultExpiry),
      metadata: {
        source: 'share_qr',
        ...metadata
      }
    };

    await this.storeQRData(qrId, qrData);

    const dataUrl = await this.generateQRCode(shareUrl, options);

    logger.info('Share QR code generated', { qrId, shareUrl });

    return { id: qrId, dataUrl };
  }

  /**
   * Generate QR code with custom data
   */
  private async generateQRCode(data: string, options: QRCodeOptions = {}): Promise<string> {
    const defaultOptions: QRCode.QRCodeToDataURLOptions = {
      type: 'image/png',
      quality: 0.92,
      margin: 2,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#FFFFFF',
      },
      width: options.width || 200,
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    };

    try {
      const dataUrl = await QRCode.toDataURL(data, defaultOptions);
      return dataUrl;
    } catch (error) {
      logger.error('QR code generation failed', { error, data });
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Store QR data in Redis with expiration
   */
  private async storeQRData(qrId: string, qrData: QRCodeData): Promise<void> {
    const key = `qr:${qrId}`;
    const ttl = Math.floor((qrData.expires.getTime() - Date.now()) / 1000);
    
    try {
      await redis.setex(key, ttl, JSON.stringify(qrData));
    } catch (error) {
      logger.error('Failed to store QR data', { error, qrId });
      // Fallback to in-memory storage could be implemented here
    }
  }

  /**
   * Retrieve QR data
   */
  async getQRData(qrId: string): Promise<QRCodeData | null> {
    const key = `qr:${qrId}`;
    
    try {
      const data = await redis.get(key);
      if (!data) return null;
      
      const qrData = JSON.parse(data) as QRCodeData;
      
      // Check if expired
      if (new Date() > new Date(qrData.expires)) {
        await this.deleteQRData(qrId);
        return null;
      }
      
      return qrData;
    } catch (error) {
      logger.error('Failed to retrieve QR data', { error, qrId });
      return null;
    }
  }

  /**
   * Delete QR data
   */
  async deleteQRData(qrId: string): Promise<void> {
    const key = `qr:${qrId}`;
    
    try {
      await redis.del(key);
    } catch (error) {
      logger.error('Failed to delete QR data', { error, qrId });
    }
  }

  /**
   * Track QR code scan
   */
  async trackQRScan(qrId: string, metadata?: any): Promise<void> {
    const qrData = await this.getQRData(qrId);
    if (!qrData) return;

    const scanEvent = {
      qrId,
      type: qrData.type,
      timestamp: new Date(),
      metadata
    };

    // Store scan event
    const scanKey = `qr:scan:${qrId}:${Date.now()}`;
    try {
      await redis.setex(scanKey, 7 * 24 * 60 * 60, JSON.stringify(scanEvent)); // Keep for 7 days
    } catch (error) {
      logger.error('Failed to track QR scan', { error, qrId });
    }

    logger.info('QR code scanned', scanEvent);
  }

  /**
   * Get QR code analytics
   */
  async getQRAnalytics(qrId: string): Promise<{
    scans: number;
    lastScan?: Date;
    data: QRCodeData | null;
  }> {
    const qrData = await this.getQRData(qrId);
    
    try {
      const scanKeys = await redis.keys(`qr:scan:${qrId}:*`);
      const scans = scanKeys.length;
      
      let lastScan: Date | undefined;
      if (scans > 0) {
        // Get the most recent scan timestamp from the key
        const timestamps = scanKeys.map(key => {
          const parts = key.split(':');
          return parseInt(parts[parts.length - 1]);
        });
        lastScan = new Date(Math.max(...timestamps));
      }

      return {
        scans,
        lastScan,
        data: qrData
      };
    } catch (error) {
      logger.error('Failed to get QR analytics', { error, qrId });
      return { scans: 0, data: qrData };
    }
  }

  /**
   * Cleanup expired QR codes
   */
  async cleanupExpiredQRCodes(): Promise<number> {
    try {
      const keys = await redis.keys('qr:*');
      let cleaned = 0;

      for (const key of keys) {
        if (key.includes(':scan:')) continue; // Skip scan events
        
        const data = await redis.get(key);
        if (!data) continue;

        try {
          const qrData = JSON.parse(data) as QRCodeData;
          if (new Date() > new Date(qrData.expires)) {
            await redis.del(key);
            cleaned++;
          }
        } catch (parseError) {
          // Invalid data, delete it
          await redis.del(key);
          cleaned++;
        }
      }

      logger.info('QR code cleanup completed', { cleaned });
      return cleaned;
    } catch (error) {
      logger.error('QR cleanup failed', { error });
      return 0;
    }
  }

  /**
   * Generate QR code with logo/branding
   */
  async generateBrandedQR(
    data: string,
    logoUrl?: string,
    options?: QRCodeOptions
  ): Promise<string> {
    // For now, just generate standard QR
    // In the future, this could integrate logo overlays
    return this.generateQRCode(data, {
      ...options,
      errorCorrectionLevel: 'H', // Higher error correction for logo overlay
    });
  }
}

// Export singleton instance
export const qrService = QRService.getInstance();