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
exports.cryptoService = exports.CryptoService = void 0;
const crypto = __importStar(require("crypto"));
const util_1 = require("util");
const logger_1 = require("../../utils/logger");
const scrypt = (0, util_1.promisify)(crypto.scrypt);
const defaultConfig = {
    algorithm: 'sha256',
    keyLength: 32,
    saltLength: 16,
    iterations: 10000,
    hmacAlgorithm: 'sha256',
    encryptionAlgorithm: 'aes-256-gcm',
    ivLength: 16
};
class CryptoService {
    static instance;
    config;
    encryptionKey;
    constructor(config = {}) {
        this.config = { ...defaultConfig, ...config };
        this.encryptionKey = this.deriveKeySync(process.env.MASTER_SECRET || 'default-master-secret-change-in-production', 'encryption');
    }
    static getInstance(config) {
        if (!CryptoService.instance) {
            CryptoService.instance = new CryptoService(config);
        }
        return CryptoService.instance;
    }
    generateRandomBytes(length) {
        return crypto.randomBytes(length);
    }
    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
    generateApiKey(prefix = 'sk') {
        const randomPart = crypto.randomBytes(24).toString('base64').replace(/[+/=]/g, '');
        const checksum = this.generateChecksum(`${prefix}_${randomPart}`).slice(0, 6);
        return `${prefix}_${randomPart}_${checksum}`;
    }
    validateApiKeyFormat(apiKey) {
        const parts = apiKey.split('_');
        if (parts.length !== 3)
            return false;
        const [prefix, random, providedChecksum] = parts;
        const expectedChecksum = this.generateChecksum(`${prefix}_${random}`).slice(0, 6);
        return crypto.timingSafeEqual(Buffer.from(providedChecksum), Buffer.from(expectedChecksum));
    }
    hash(data) {
        return crypto
            .createHash(this.config.algorithm)
            .update(data)
            .digest('hex');
    }
    async hashWithSalt(data, salt) {
        const useSalt = salt || crypto.randomBytes(this.config.saltLength).toString('hex');
        const derivedKey = await scrypt(data, useSalt, this.config.keyLength);
        return `${useSalt}:${derivedKey.toString('hex')}`;
    }
    async verifyHash(data, hashedData) {
        const [salt, hash] = hashedData.split(':');
        const derivedKey = await scrypt(data, salt, this.config.keyLength);
        return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derivedKey);
    }
    generateHMAC(data, secret) {
        return crypto
            .createHmac(this.config.hmacAlgorithm, secret)
            .update(data)
            .digest('hex');
    }
    verifyHMAC(data, signature, secret) {
        const expectedSignature = this.generateHMAC(data, secret);
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
    generateWebhookSignature(payload, secret) {
        const timestamp = Math.floor(Date.now() / 1000);
        const message = `${timestamp}.${JSON.stringify(payload)}`;
        const signature = this.generateHMAC(message, secret);
        return {
            signature,
            timestamp,
            header: `t=${timestamp},v1=${signature}`
        };
    }
    verifyWebhookSignature(payload, signatureHeader, secret, maxAgeSeconds = 300) {
        try {
            const parts = signatureHeader.split(',');
            const timestamp = parseInt(parts[0].split('=')[1]);
            const signature = parts[1].split('=')[1];
            const currentTime = Math.floor(Date.now() / 1000);
            if (currentTime - timestamp > maxAgeSeconds) {
                logger_1.logger.warn('Webhook signature expired', { age: currentTime - timestamp });
                return false;
            }
            const message = `${timestamp}.${JSON.stringify(payload)}`;
            return this.verifyHMAC(message, signature, secret);
        }
        catch (error) {
            logger_1.logger.error('Webhook signature verification failed', error);
            return false;
        }
    }
    encrypt(data) {
        const iv = crypto.randomBytes(this.config.ivLength);
        const cipher = crypto.createCipheriv(this.config.encryptionAlgorithm, this.encryptionKey, iv);
        let encrypted = cipher.update(data);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        const tag = cipher.getAuthTag();
        return {
            encrypted: encrypted.toString('hex'),
            iv: iv.toString('hex'),
            tag: tag.toString('hex')
        };
    }
    decrypt(encryptedData, iv, tag) {
        const decipher = crypto.createDecipheriv(this.config.encryptionAlgorithm, this.encryptionKey, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(tag, 'hex'));
        let decrypted = decipher.update(Buffer.from(encryptedData, 'hex'));
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }
    generateRequestSignature(method, path, body, timestamp, apiKey, apiSecret) {
        const bodyHash = body ? this.hash(JSON.stringify(body)) : '';
        const message = `${method.toUpperCase()}:${path}:${timestamp}:${bodyHash}:${apiKey}`;
        return this.generateHMAC(message, apiSecret);
    }
    verifyRequestSignature(method, path, body, timestamp, apiKey, apiSecret, providedSignature, maxAgeSeconds = 300) {
        const currentTime = Math.floor(Date.now() / 1000);
        if (Math.abs(currentTime - timestamp) > maxAgeSeconds) {
            logger_1.logger.warn('Request signature expired', { age: Math.abs(currentTime - timestamp) });
            return false;
        }
        const expectedSignature = this.generateRequestSignature(method, path, body, timestamp, apiKey, apiSecret);
        return crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature));
    }
    generateEntropy(bits = 256) {
        const bytes = Math.ceil(bits / 8);
        return crypto.randomBytes(bytes).toString('hex');
    }
    deriveKeySync(password, salt) {
        return crypto.scryptSync(password, salt, this.config.keyLength);
    }
    generateChecksum(data) {
        return crypto
            .createHash('sha256')
            .update(data)
            .digest('hex');
    }
    constantTimeCompare(a, b) {
        if (a.length !== b.length)
            return false;
        return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    }
    generateMultipartSignature(parts, secret) {
        const sortedParts = parts.sort((a, b) => a.name.localeCompare(b.name));
        const message = sortedParts.map(p => `${p.name}=${p.value}`).join('&');
        return this.generateHMAC(message, secret);
    }
}
exports.CryptoService = CryptoService;
exports.cryptoService = CryptoService.getInstance();
//# sourceMappingURL=crypto.service.js.map