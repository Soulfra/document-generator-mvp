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
exports.qrService = exports.QRService = void 0;
const QRCode = __importStar(require("qrcode"));
const uuid_1 = require("uuid");
const logger_1 = require("../../utils/logger");
const redis_1 = require("../../config/redis");
class QRService {
    static instance;
    defaultExpiry = 24 * 60 * 60 * 1000;
    static getInstance() {
        if (!QRService.instance) {
            QRService.instance = new QRService();
        }
        return QRService.instance;
    }
    async generateReferralQR(referralCode, baseUrl = 'https://finishthisidea.com', options) {
        const qrId = (0, uuid_1.v4)();
        const url = `${baseUrl}?ref=${referralCode}&qr=${qrId}`;
        const qrData = {
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
        await this.storeQRData(qrId, qrData);
        const dataUrl = await this.generateQRCode(url, options);
        logger_1.logger.info('Referral QR code generated', { qrId, referralCode });
        return { id: qrId, dataUrl, url };
    }
    async generateAuthQR(sessionData, expiryMinutes = 10) {
        const qrId = (0, uuid_1.v4)();
        const expires = new Date(Date.now() + expiryMinutes * 60 * 1000);
        const qrData = {
            id: qrId,
            type: 'auth',
            data: sessionData,
            expires,
            metadata: {
                source: 'auth_qr'
            }
        };
        await this.storeQRData(qrId, qrData);
        const dataUrl = await this.generateQRCode(qrId, {
            errorCorrectionLevel: 'H',
            width: 256
        });
        logger_1.logger.info('Auth QR code generated', { qrId, expiryMinutes });
        return { id: qrId, dataUrl };
    }
    async generateShareQR(shareUrl, metadata, options) {
        const qrId = (0, uuid_1.v4)();
        const qrData = {
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
        logger_1.logger.info('Share QR code generated', { qrId, shareUrl });
        return { id: qrId, dataUrl };
    }
    async generateQRCode(data, options = {}) {
        const defaultOptions = {
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
        }
        catch (error) {
            logger_1.logger.error('QR code generation failed', { error, data });
            throw new Error('Failed to generate QR code');
        }
    }
    async storeQRData(qrId, qrData) {
        const key = `qr:${qrId}`;
        const ttl = Math.floor((qrData.expires.getTime() - Date.now()) / 1000);
        try {
            await redis_1.redis.setex(key, ttl, JSON.stringify(qrData));
        }
        catch (error) {
            logger_1.logger.error('Failed to store QR data', { error, qrId });
        }
    }
    async getQRData(qrId) {
        const key = `qr:${qrId}`;
        try {
            const data = await redis_1.redis.get(key);
            if (!data)
                return null;
            const qrData = JSON.parse(data);
            if (new Date() > new Date(qrData.expires)) {
                await this.deleteQRData(qrId);
                return null;
            }
            return qrData;
        }
        catch (error) {
            logger_1.logger.error('Failed to retrieve QR data', { error, qrId });
            return null;
        }
    }
    async deleteQRData(qrId) {
        const key = `qr:${qrId}`;
        try {
            await redis_1.redis.del(key);
        }
        catch (error) {
            logger_1.logger.error('Failed to delete QR data', { error, qrId });
        }
    }
    async trackQRScan(qrId, metadata) {
        const qrData = await this.getQRData(qrId);
        if (!qrData)
            return;
        const scanEvent = {
            qrId,
            type: qrData.type,
            timestamp: new Date(),
            metadata
        };
        const scanKey = `qr:scan:${qrId}:${Date.now()}`;
        try {
            await redis_1.redis.setex(scanKey, 7 * 24 * 60 * 60, JSON.stringify(scanEvent));
        }
        catch (error) {
            logger_1.logger.error('Failed to track QR scan', { error, qrId });
        }
        logger_1.logger.info('QR code scanned', scanEvent);
    }
    async getQRAnalytics(qrId) {
        const qrData = await this.getQRData(qrId);
        try {
            const scanKeys = await redis_1.redis.keys(`qr:scan:${qrId}:*`);
            const scans = scanKeys.length;
            let lastScan;
            if (scans > 0) {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get QR analytics', { error, qrId });
            return { scans: 0, data: qrData };
        }
    }
    async cleanupExpiredQRCodes() {
        try {
            const keys = await redis_1.redis.keys('qr:*');
            let cleaned = 0;
            for (const key of keys) {
                if (key.includes(':scan:'))
                    continue;
                const data = await redis_1.redis.get(key);
                if (!data)
                    continue;
                try {
                    const qrData = JSON.parse(data);
                    if (new Date() > new Date(qrData.expires)) {
                        await redis_1.redis.del(key);
                        cleaned++;
                    }
                }
                catch (parseError) {
                    await redis_1.redis.del(key);
                    cleaned++;
                }
            }
            logger_1.logger.info('QR code cleanup completed', { cleaned });
            return cleaned;
        }
        catch (error) {
            logger_1.logger.error('QR cleanup failed', { error });
            return 0;
        }
    }
    async generateBrandedQR(data, logoUrl, options) {
        return this.generateQRCode(data, {
            ...options,
            errorCorrectionLevel: 'H',
        });
    }
}
exports.QRService = QRService;
exports.qrService = QRService.getInstance();
//# sourceMappingURL=qr.service.js.map