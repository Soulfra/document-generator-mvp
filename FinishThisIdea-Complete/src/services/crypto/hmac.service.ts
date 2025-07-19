/**
 * HMAC Request Signing Service
 * Provides request signing and verification for API security
 * Inspired by soulfra-agentzero webhook patterns
 */

import { Request } from 'express';
import { cryptoService } from './crypto.service';
import { logger } from '../../utils/logger';
import { redis } from '../../config/redis';
import { AppError } from '../../utils/errors';
import { prometheusMetrics } from '../monitoring/prometheus-metrics.service';

export interface SignatureConfig {
  headerName: string;
  timestampHeaderName: string;
  apiKeyHeaderName: string;
  maxAgeSeconds: number;
  replayProtection: boolean;
  requiredHeaders: string[];
}

const defaultConfig: SignatureConfig = {
  headerName: 'X-Signature',
  timestampHeaderName: 'X-Timestamp',
  apiKeyHeaderName: 'X-API-Key',
  maxAgeSeconds: 300, // 5 minutes
  replayProtection: true,
  requiredHeaders: ['X-Request-ID']
};

export interface SignedRequest {
  method: string;
  path: string;
  query?: any;
  body?: any;
  headers: Record<string, string>;
  timestamp: number;
  apiKey: string;
}

export class HMACService {
  private static instance: HMACService;
  private config: SignatureConfig;
  private nonceCache = new Set<string>();

  constructor(config: Partial<SignatureConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    
    // Cleanup old nonces periodically
    if (this.config.replayProtection) {
      setInterval(() => this.cleanupNonces(), 60000); // Every minute
    }
  }

  public static getInstance(config?: Partial<SignatureConfig>): HMACService {
    if (!HMACService.instance) {
      HMACService.instance = new HMACService(config);
    }
    return HMACService.instance;
  }

  /**
   * Generate signature for outgoing request
   */
  public async signRequest(
    request: SignedRequest,
    apiSecret: string
  ): Promise<{ signature: string; headers: Record<string, string> }> {
    const timestamp = request.timestamp || Math.floor(Date.now() / 1000);
    const nonce = cryptoService.generateSecureToken(16);
    
    // Create canonical request
    const canonicalRequest = this.createCanonicalRequest(request, timestamp, nonce);
    
    // Generate signature
    const signature = cryptoService.generateHMAC(canonicalRequest, apiSecret);
    
    // Store nonce for replay protection
    if (this.config.replayProtection) {
      await this.storeNonce(nonce, timestamp);
    }

    return {
      signature,
      headers: {
        [this.config.headerName]: signature,
        [this.config.timestampHeaderName]: timestamp.toString(),
        [this.config.apiKeyHeaderName]: request.apiKey,
        'X-Nonce': nonce,
        'X-Request-ID': request.headers['X-Request-ID'] || cryptoService.generateSecureToken(12)
      }
    };
  }

  /**
   * Verify incoming request signature
   */
  public async verifyRequest(
    req: Request,
    apiSecret: string
  ): Promise<{ valid: boolean; reason?: string }> {
    const start = Date.now();
    
    try {
      // Extract required headers
      const signature = req.headers[this.config.headerName.toLowerCase()] as string;
      const timestamp = parseInt(req.headers[this.config.timestampHeaderName.toLowerCase()] as string);
      const apiKey = req.headers[this.config.apiKeyHeaderName.toLowerCase()] as string;
      const nonce = req.headers['x-nonce'] as string;

      if (!signature || !timestamp || !apiKey) {
        prometheusMetrics.authAttempts.inc({ status: 'missing_headers' });
        return { valid: false, reason: 'Missing required signature headers' };
      }

      // Check timestamp
      const currentTime = Math.floor(Date.now() / 1000);
      if (Math.abs(currentTime - timestamp) > this.config.maxAgeSeconds) {
        prometheusMetrics.authAttempts.inc({ status: 'expired' });
        return { valid: false, reason: 'Request signature expired' };
      }

      // Check replay attack
      if (this.config.replayProtection && nonce) {
        const isReplay = await this.checkReplay(nonce);
        if (isReplay) {
          prometheusMetrics.authAttempts.inc({ status: 'replay' });
          logger.warn('Replay attack detected', { apiKey, nonce });
          return { valid: false, reason: 'Replay attack detected' };
        }
      }

      // Create canonical request
      const canonicalRequest = this.createCanonicalRequestFromExpress(req, timestamp, nonce);
      
      // Verify signature
      const isValid = cryptoService.verifyHMAC(canonicalRequest, signature, apiSecret);
      
      if (isValid) {
        prometheusMetrics.authAttempts.inc({ status: 'success' });
        prometheusMetrics.functionDuration.observe(
          { name: 'hmac_verification' },
          Date.now() - start
        );
        
        // Store nonce after successful verification
        if (this.config.replayProtection && nonce) {
          await this.storeNonce(nonce, timestamp);
        }
        
        return { valid: true };
      } else {
        prometheusMetrics.authAttempts.inc({ status: 'invalid_signature' });
        return { valid: false, reason: 'Invalid signature' };
      }

    } catch (error) {
      logger.error('Signature verification error', error);
      prometheusMetrics.functionErrors.inc({ name: 'hmac_verification_error' });
      return { valid: false, reason: 'Signature verification failed' };
    }
  }

  /**
   * Create canonical request string
   */
  private createCanonicalRequest(
    request: SignedRequest,
    timestamp: number,
    nonce: string
  ): string {
    const parts = [
      request.method.toUpperCase(),
      request.path,
      this.canonicalizeQuery(request.query),
      this.canonicalizeHeaders(request.headers),
      timestamp.toString(),
      nonce,
      request.apiKey,
      this.hashBody(request.body)
    ];

    return parts.join('\n');
  }

  /**
   * Create canonical request from Express request
   */
  private createCanonicalRequestFromExpress(
    req: Request,
    timestamp: number,
    nonce: string
  ): string {
    const parts = [
      req.method.toUpperCase(),
      req.path,
      this.canonicalizeQuery(req.query),
      this.canonicalizeHeaders(req.headers as Record<string, string>),
      timestamp.toString(),
      nonce || '',
      req.headers[this.config.apiKeyHeaderName.toLowerCase()] as string,
      this.hashBody(req.body)
    ];

    return parts.join('\n');
  }

  /**
   * Canonicalize query parameters
   */
  private canonicalizeQuery(query?: any): string {
    if (!query || Object.keys(query).length === 0) {
      return '';
    }

    const params = Object.keys(query)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
      .join('&');

    return params;
  }

  /**
   * Canonicalize headers
   */
  private canonicalizeHeaders(headers: Record<string, string>): string {
    const requiredHeaders = this.config.requiredHeaders.map(h => h.toLowerCase());
    const canonicalHeaders = requiredHeaders
      .sort()
      .map(header => {
        const value = headers[header] || '';
        return `${header}:${value.trim()}`;
      })
      .join('\n');

    return canonicalHeaders;
  }

  /**
   * Hash request body
   */
  private hashBody(body?: any): string {
    if (!body || Object.keys(body).length === 0) {
      return cryptoService.hash('');
    }

    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    return cryptoService.hash(bodyString);
  }

  /**
   * Check for replay attack
   */
  private async checkReplay(nonce: string): Promise<boolean> {
    const key = `hmac:nonce:${nonce}`;
    const exists = await redis.exists(key);
    return exists === 1;
  }

  /**
   * Store nonce for replay protection
   */
  private async storeNonce(nonce: string, timestamp: number): Promise<void> {
    const key = `hmac:nonce:${nonce}`;
    const ttl = this.config.maxAgeSeconds * 2; // Keep for twice the max age
    
    await redis.setex(key, ttl, timestamp.toString());
    this.nonceCache.add(nonce);
  }

  /**
   * Cleanup old nonces from memory cache
   */
  private cleanupNonces(): void {
    if (this.nonceCache.size > 10000) {
      this.nonceCache.clear();
    }
  }

  /**
   * Generate signed URL for temporary access
   */
  public generateSignedUrl(
    url: string,
    expiresIn: number,
    apiKey: string,
    apiSecret: string
  ): string {
    const expires = Math.floor(Date.now() / 1000) + expiresIn;
    const parsedUrl = new URL(url);
    
    // Add expiration to query params
    parsedUrl.searchParams.set('expires', expires.toString());
    parsedUrl.searchParams.set('apiKey', apiKey);
    
    // Create signature
    const message = `${parsedUrl.pathname}${parsedUrl.search}:${expires}`;
    const signature = cryptoService.generateHMAC(message, apiSecret);
    
    parsedUrl.searchParams.set('signature', signature);
    
    return parsedUrl.toString();
  }

  /**
   * Verify signed URL
   */
  public verifySignedUrl(
    url: string,
    apiSecret: string
  ): { valid: boolean; reason?: string } {
    try {
      const parsedUrl = new URL(url);
      const expires = parseInt(parsedUrl.searchParams.get('expires') || '0');
      const signature = parsedUrl.searchParams.get('signature') || '';
      const apiKey = parsedUrl.searchParams.get('apiKey') || '';
      
      // Check expiration
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime > expires) {
        return { valid: false, reason: 'URL expired' };
      }
      
      // Remove signature from params for verification
      parsedUrl.searchParams.delete('signature');
      
      // Recreate message
      const message = `${parsedUrl.pathname}${parsedUrl.search}:${expires}`;
      
      // Verify signature
      const isValid = cryptoService.verifyHMAC(message, signature, apiSecret);
      
      return { valid: isValid, reason: isValid ? undefined : 'Invalid signature' };
    } catch (error) {
      logger.error('Signed URL verification error', error);
      return { valid: false, reason: 'Invalid URL format' };
    }
  }
}

// Export singleton instance
export const hmacService = HMACService.getInstance();