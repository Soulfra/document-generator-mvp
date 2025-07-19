"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrAuthService = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
const database_1 = require("../utils/database");
const crypto_1 = __importDefault(require("crypto"));
// Redis import with fallback
let redis = null;
try {
    const { createClient } = require('redis');
    redis = { createClient };
}
catch (error) {
    logger_1.logger.warn('Redis not available, QR codes will use in-memory storage', { error: error.message });
}
class QRAuthService {
    constructor() {
        this.qrCodeExpiry = 600; // 10 minutes
        this.baseUrl = process.env.QR_AUTH_BASE_URL || 'http://localhost:3002/qr-login';
        this.inMemoryStore = new Map();
        this.initRedis();
    }
    async initRedis() {
        if (!redis) {
            logger_1.logger.info('Using in-memory QR code storage (Redis not available)');
            return;
        }
        try {
            this.redis = redis.createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6380'
            });
            this.redis.on('error', (err) => {
                logger_1.logger.error('Redis Client Error', err);
            });
            await this.redis.connect();
            logger_1.logger.info('QR Auth Service connected to Redis');
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to Redis for QR Auth, using in-memory storage', { error });
            this.redis = null;
        }
    }
    /**
     * Generate QR code for user authentication/onboarding
     */
    async generateQRCode(sessionId, metadata = {}) {
        try {
            const uuid = `qr-${(0, uuid_1.v4)()}`;
            const timestamp = new Date().toISOString();
            // Create QR payload with FinishThisIdea-specific data
            const qrPayload = {
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
                await this.redis.setEx(`qr:${uuid}`, this.qrCodeExpiry, JSON.stringify(qrPayload));
            }
            else {
                // Store in memory with cleanup timer
                this.inMemoryStore.set(uuid, qrPayload);
                setTimeout(() => {
                    this.inMemoryStore.delete(uuid);
                }, this.qrCodeExpiry * 1000);
            }
            // Generate QR code URL
            const qrUrl = `${this.baseUrl}?uuid=${uuid}`;
            // Generate QR code image (base64)
            const qrCodeImage = await qrcode_1.default.toDataURL(qrUrl, {
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
            const qrCodeSvg = await qrcode_1.default.toString(qrUrl, {
                errorCorrectionLevel: 'M',
                type: 'svg',
                width: 256
            });
            logger_1.logger.info('QR auth code generated successfully', { uuid, sessionId });
            return {
                uuid,
                url: qrUrl,
                image: qrCodeImage,
                svg: qrCodeSvg,
                expires_at: qrPayload.expires_at,
                sessionId,
                metadata: qrPayload.metadata
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating QR auth code', { error });
            throw new Error('Failed to generate QR authentication code');
        }
    }
    /**
     * Validate and process QR code scan
     */
    async validateQRCode(uuid) {
        try {
            if (!this.redis) {
                throw new Error('Redis not available');
            }
            const qrData = await this.redis.get(`qr:${uuid}`);
            if (!qrData) {
                logger_1.logger.warn('Invalid or expired QR code', { uuid });
                return null;
            }
            const parsedData = JSON.parse(qrData);
            // Check if QR code has expired
            if (new Date(parsedData.expires_at) < new Date()) {
                logger_1.logger.warn('QR code has expired', { uuid });
                await this.redis.del(`qr:${uuid}`);
                return null;
            }
            return parsedData;
        }
        catch (error) {
            logger_1.logger.error('Error validating QR code', { error });
            throw new Error('Failed to validate QR code');
        }
    }
    /**
     * Complete QR authentication - create user session
     */
    async completeQRAuth(uuid, userInfo = {}) {
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
                await this.redis.setEx(`qr:${uuid}`, 3600, // Keep for 1 hour after use for audit
                JSON.stringify(qrData));
            }
            // Create user session/profile if it doesn't exist
            let user = await database_1.prisma.user.findUnique({
                where: { id: userId }
            }).catch(() => null);
            if (!user) {
                user = await database_1.prisma.user.create({
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
                    logger_1.logger.warn('User table not found, using session-based auth', { error: error.message });
                    return {
                        id: userId,
                        name: userInfo.name || `User_${userId.slice(-8)}`,
                        qrAuthEnabled: true
                    };
                });
            }
            logger_1.logger.info('QR authentication completed', { uuid, userId });
            return {
                success: true,
                user,
                sessionId: qrData.sessionId,
                authToken: this.generateAuthToken(userId),
                onboarding: !user.email // Trigger onboarding if no email
            };
        }
        catch (error) {
            logger_1.logger.error('Error completing QR authentication', { error });
            throw error;
        }
    }
    /**
     * Generate QR code specifically for file sharing/project collaboration
     */
    async generateProjectShareQR(projectId, uploadId, permissions = []) {
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
    async generateReferralQR(referrerId, incentive) {
        const metadata = {
            type: 'referral',
            referrerId,
            incentive: incentive || 'free_premium_service',
            reward: 'both_get_credit'
        };
        return this.generateQRCode(`referral-${referrerId}`, metadata);
    }
    generateSecureUserId() {
        return `user_${crypto_1.default.randomBytes(8).toString('hex')}`;
    }
    generateAuthToken(userId) {
        return crypto_1.default
            .createHmac('sha256', process.env.JWT_SECRET || 'finishthisidea-secret')
            .update(`${userId}-${Date.now()}`)
            .digest('hex');
    }
    /**
     * Get QR authentication statistics
     */
    async getQRStats() {
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
                referrals: 0
            };
            for (const key of keys) {
                const data = await this.redis.get(key);
                if (data) {
                    const qrData = JSON.parse(data);
                    if (qrData.used) {
                        stats.used++;
                    }
                    else if (new Date(qrData.expires_at) < new Date()) {
                        stats.expired++;
                    }
                    else {
                        stats.active++;
                    }
                    // Count special types
                    if (qrData.metadata?.type === 'project_share') {
                        stats.project_shares++;
                    }
                    else if (qrData.metadata?.type === 'referral') {
                        stats.referrals++;
                    }
                }
            }
            return stats;
        }
        catch (error) {
            logger_1.logger.error('Error getting QR stats', { error });
            return { error: 'Failed to get QR statistics' };
        }
    }
    /**
     * Cleanup expired QR codes
     */
    async cleanupExpiredQRCodes() {
        try {
            if (!this.redis) {
                return 0;
            }
            const keys = await this.redis.keys('qr:*');
            let cleaned = 0;
            for (const key of keys) {
                const data = await this.redis.get(key);
                if (data) {
                    const qrData = JSON.parse(data);
                    if (new Date(qrData.expires_at) < new Date() && !qrData.used) {
                        await this.redis.del(key);
                        cleaned++;
                    }
                }
            }
            logger_1.logger.info(`Cleaned up ${cleaned} expired QR codes`);
            return cleaned;
        }
        catch (error) {
            logger_1.logger.error('Error cleaning up QR codes', { error });
            return 0;
        }
    }
}
exports.qrAuthService = new QRAuthService();
//# sourceMappingURL=qr-auth.service.js.map