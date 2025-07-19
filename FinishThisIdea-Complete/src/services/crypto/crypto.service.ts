/**
 * Centralized Cryptographic Service
 * Provides crypto operations including HMAC, hashing, and encryption
 * Adapted from soulfra-agentzero NodeCryptoProvider patterns
 */

import * as crypto from 'crypto';
import { promisify } from 'util';
import { logger } from '../../utils/logger';

const scrypt = promisify(crypto.scrypt);

export interface CryptoConfig {
  algorithm: string;
  keyLength: number;
  saltLength: number;
  iterations: number;
  hmacAlgorithm: string;
  encryptionAlgorithm: string;
  ivLength: number;
}

const defaultConfig: CryptoConfig = {
  algorithm: 'sha256',
  keyLength: 32,
  saltLength: 16,
  iterations: 10000,
  hmacAlgorithm: 'sha256',
  encryptionAlgorithm: 'aes-256-gcm',
  ivLength: 16
};

export class CryptoService {
  private static instance: CryptoService;
  private config: CryptoConfig;
  private encryptionKey: Buffer;

  constructor(config: Partial<CryptoConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    // Derive encryption key from master secret
    this.encryptionKey = this.deriveKeySync(
      process.env.MASTER_SECRET || 'default-master-secret-change-in-production',
      'encryption'
    );
  }

  public static getInstance(config?: Partial<CryptoConfig>): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService(config);
    }
    return CryptoService.instance;
  }

  /**
   * Generate cryptographically secure random bytes
   */
  public generateRandomBytes(length: number): Buffer {
    return crypto.randomBytes(length);
  }

  /**
   * Generate secure random string
   */
  public generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate API key with prefix and checksum
   */
  public generateApiKey(prefix: string = 'sk'): string {
    const randomPart = crypto.randomBytes(24).toString('base64').replace(/[+/=]/g, '');
    const checksum = this.generateChecksum(`${prefix}_${randomPart}`).slice(0, 6);
    return `${prefix}_${randomPart}_${checksum}`;
  }

  /**
   * Validate API key format and checksum
   */
  public validateApiKeyFormat(apiKey: string): boolean {
    const parts = apiKey.split('_');
    if (parts.length !== 3) return false;
    
    const [prefix, random, providedChecksum] = parts;
    const expectedChecksum = this.generateChecksum(`${prefix}_${random}`).slice(0, 6);
    
    return crypto.timingSafeEqual(
      Buffer.from(providedChecksum),
      Buffer.from(expectedChecksum)
    );
  }

  /**
   * Hash data using configured algorithm
   */
  public hash(data: string | Buffer): string {
    return crypto
      .createHash(this.config.algorithm)
      .update(data)
      .digest('hex');
  }

  /**
   * Hash with salt (for passwords)
   */
  public async hashWithSalt(data: string, salt?: string): Promise<string> {
    const useSalt = salt || crypto.randomBytes(this.config.saltLength).toString('hex');
    const derivedKey = await scrypt(data, useSalt, this.config.keyLength) as Buffer;
    return `${useSalt}:${derivedKey.toString('hex')}`;
  }

  /**
   * Verify hashed data
   */
  public async verifyHash(data: string, hashedData: string): Promise<boolean> {
    const [salt, hash] = hashedData.split(':');
    const derivedKey = await scrypt(data, salt, this.config.keyLength) as Buffer;
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derivedKey);
  }

  /**
   * Generate HMAC signature
   */
  public generateHMAC(data: string | Buffer, secret: string): string {
    return crypto
      .createHmac(this.config.hmacAlgorithm, secret)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  public verifyHMAC(data: string | Buffer, signature: string, secret: string): boolean {
    const expectedSignature = this.generateHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Generate webhook signature with timestamp
   */
  public generateWebhookSignature(payload: any, secret: string): {
    signature: string;
    timestamp: number;
    header: string;
  } {
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `${timestamp}.${JSON.stringify(payload)}`;
    const signature = this.generateHMAC(message, secret);
    
    return {
      signature,
      timestamp,
      header: `t=${timestamp},v1=${signature}`
    };
  }

  /**
   * Verify webhook signature with timestamp validation
   */
  public verifyWebhookSignature(
    payload: any,
    signatureHeader: string,
    secret: string,
    maxAgeSeconds: number = 300
  ): boolean {
    try {
      const parts = signatureHeader.split(',');
      const timestamp = parseInt(parts[0].split('=')[1]);
      const signature = parts[1].split('=')[1];

      // Check timestamp to prevent replay attacks
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime - timestamp > maxAgeSeconds) {
        logger.warn('Webhook signature expired', { age: currentTime - timestamp });
        return false;
      }

      const message = `${timestamp}.${JSON.stringify(payload)}`;
      return this.verifyHMAC(message, signature, secret);
    } catch (error) {
      logger.error('Webhook signature verification failed', error);
      return false;
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  public encrypt(data: string | Buffer): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(this.config.ivLength);
    const cipher = crypto.createCipheriv(
      this.config.encryptionAlgorithm,
      this.encryptionKey,
      iv
    );

    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const tag = (cipher as any).getAuthTag();

    return {
      encrypted: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  public decrypt(encryptedData: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipheriv(
      this.config.encryptionAlgorithm,
      this.encryptionKey,
      Buffer.from(iv, 'hex')
    );

    (decipher as any).setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(Buffer.from(encryptedData, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  }

  /**
   * Generate request signature for API calls
   */
  public generateRequestSignature(
    method: string,
    path: string,
    body: any,
    timestamp: number,
    apiKey: string,
    apiSecret: string
  ): string {
    const bodyHash = body ? this.hash(JSON.stringify(body)) : '';
    const message = `${method.toUpperCase()}:${path}:${timestamp}:${bodyHash}:${apiKey}`;
    return this.generateHMAC(message, apiSecret);
  }

  /**
   * Verify request signature
   */
  public verifyRequestSignature(
    method: string,
    path: string,
    body: any,
    timestamp: number,
    apiKey: string,
    apiSecret: string,
    providedSignature: string,
    maxAgeSeconds: number = 300
  ): boolean {
    // Check timestamp
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - timestamp) > maxAgeSeconds) {
      logger.warn('Request signature expired', { age: Math.abs(currentTime - timestamp) });
      return false;
    }

    const expectedSignature = this.generateRequestSignature(
      method,
      path,
      body,
      timestamp,
      apiKey,
      apiSecret
    );

    return crypto.timingSafeEqual(
      Buffer.from(providedSignature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Generate entropy (for vault-style operations)
   */
  public generateEntropy(bits: number = 256): string {
    const bytes = Math.ceil(bits / 8);
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Derive key from password (sync version for initialization)
   */
  private deriveKeySync(password: string, salt: string): Buffer {
    return crypto.scryptSync(password, salt, this.config.keyLength);
  }

  /**
   * Generate checksum for data integrity
   */
  private generateChecksum(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }

  /**
   * Constant time string comparison
   */
  public constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  /**
   * Generate signature for multipart requests
   */
  public generateMultipartSignature(
    parts: Array<{ name: string; value: string }>,
    secret: string
  ): string {
    const sortedParts = parts.sort((a, b) => a.name.localeCompare(b.name));
    const message = sortedParts.map(p => `${p.name}=${p.value}`).join('&');
    return this.generateHMAC(message, secret);
  }
}

// Export singleton instance
export const cryptoService = CryptoService.getInstance();