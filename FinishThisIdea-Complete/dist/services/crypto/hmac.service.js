"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hmacService = exports.HMACService = void 0;
const crypto_service_1 = require("./crypto.service");
const logger_1 = require("../../utils/logger");
const redis_1 = require("../../config/redis");
const prometheus_metrics_service_1 = require("../monitoring/prometheus-metrics.service");
const defaultConfig = {
    headerName: 'X-Signature',
    timestampHeaderName: 'X-Timestamp',
    apiKeyHeaderName: 'X-API-Key',
    maxAgeSeconds: 300,
    replayProtection: true,
    requiredHeaders: ['X-Request-ID']
};
class HMACService {
    static instance;
    config;
    nonceCache = new Set();
    constructor(config = {}) {
        this.config = { ...defaultConfig, ...config };
        if (this.config.replayProtection) {
            setInterval(() => this.cleanupNonces(), 60000);
        }
    }
    static getInstance(config) {
        if (!HMACService.instance) {
            HMACService.instance = new HMACService(config);
        }
        return HMACService.instance;
    }
    async signRequest(request, apiSecret) {
        const timestamp = request.timestamp || Math.floor(Date.now() / 1000);
        const nonce = crypto_service_1.cryptoService.generateSecureToken(16);
        const canonicalRequest = this.createCanonicalRequest(request, timestamp, nonce);
        const signature = crypto_service_1.cryptoService.generateHMAC(canonicalRequest, apiSecret);
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
                'X-Request-ID': request.headers['X-Request-ID'] || crypto_service_1.cryptoService.generateSecureToken(12)
            }
        };
    }
    async verifyRequest(req, apiSecret) {
        const start = Date.now();
        try {
            const signature = req.headers[this.config.headerName.toLowerCase()];
            const timestamp = parseInt(req.headers[this.config.timestampHeaderName.toLowerCase()]);
            const apiKey = req.headers[this.config.apiKeyHeaderName.toLowerCase()];
            const nonce = req.headers['x-nonce'];
            if (!signature || !timestamp || !apiKey) {
                prometheus_metrics_service_1.prometheusMetrics.authAttempts.inc({ status: 'missing_headers' });
                return { valid: false, reason: 'Missing required signature headers' };
            }
            const currentTime = Math.floor(Date.now() / 1000);
            if (Math.abs(currentTime - timestamp) > this.config.maxAgeSeconds) {
                prometheus_metrics_service_1.prometheusMetrics.authAttempts.inc({ status: 'expired' });
                return { valid: false, reason: 'Request signature expired' };
            }
            if (this.config.replayProtection && nonce) {
                const isReplay = await this.checkReplay(nonce);
                if (isReplay) {
                    prometheus_metrics_service_1.prometheusMetrics.authAttempts.inc({ status: 'replay' });
                    logger_1.logger.warn('Replay attack detected', { apiKey, nonce });
                    return { valid: false, reason: 'Replay attack detected' };
                }
            }
            const canonicalRequest = this.createCanonicalRequestFromExpress(req, timestamp, nonce);
            const isValid = crypto_service_1.cryptoService.verifyHMAC(canonicalRequest, signature, apiSecret);
            if (isValid) {
                prometheus_metrics_service_1.prometheusMetrics.authAttempts.inc({ status: 'success' });
                prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'hmac_verification' }, Date.now() - start);
                if (this.config.replayProtection && nonce) {
                    await this.storeNonce(nonce, timestamp);
                }
                return { valid: true };
            }
            else {
                prometheus_metrics_service_1.prometheusMetrics.authAttempts.inc({ status: 'invalid_signature' });
                return { valid: false, reason: 'Invalid signature' };
            }
        }
        catch (error) {
            logger_1.logger.error('Signature verification error', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'hmac_verification_error' });
            return { valid: false, reason: 'Signature verification failed' };
        }
    }
    createCanonicalRequest(request, timestamp, nonce) {
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
    createCanonicalRequestFromExpress(req, timestamp, nonce) {
        const parts = [
            req.method.toUpperCase(),
            req.path,
            this.canonicalizeQuery(req.query),
            this.canonicalizeHeaders(req.headers),
            timestamp.toString(),
            nonce || '',
            req.headers[this.config.apiKeyHeaderName.toLowerCase()],
            this.hashBody(req.body)
        ];
        return parts.join('\n');
    }
    canonicalizeQuery(query) {
        if (!query || Object.keys(query).length === 0) {
            return '';
        }
        const params = Object.keys(query)
            .sort()
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
            .join('&');
        return params;
    }
    canonicalizeHeaders(headers) {
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
    hashBody(body) {
        if (!body || Object.keys(body).length === 0) {
            return crypto_service_1.cryptoService.hash('');
        }
        const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
        return crypto_service_1.cryptoService.hash(bodyString);
    }
    async checkReplay(nonce) {
        const key = `hmac:nonce:${nonce}`;
        const exists = await redis_1.redis.exists(key);
        return exists === 1;
    }
    async storeNonce(nonce, timestamp) {
        const key = `hmac:nonce:${nonce}`;
        const ttl = this.config.maxAgeSeconds * 2;
        await redis_1.redis.setex(key, ttl, timestamp.toString());
        this.nonceCache.add(nonce);
    }
    cleanupNonces() {
        if (this.nonceCache.size > 10000) {
            this.nonceCache.clear();
        }
    }
    generateSignedUrl(url, expiresIn, apiKey, apiSecret) {
        const expires = Math.floor(Date.now() / 1000) + expiresIn;
        const parsedUrl = new URL(url);
        parsedUrl.searchParams.set('expires', expires.toString());
        parsedUrl.searchParams.set('apiKey', apiKey);
        const message = `${parsedUrl.pathname}${parsedUrl.search}:${expires}`;
        const signature = crypto_service_1.cryptoService.generateHMAC(message, apiSecret);
        parsedUrl.searchParams.set('signature', signature);
        return parsedUrl.toString();
    }
    verifySignedUrl(url, apiSecret) {
        try {
            const parsedUrl = new URL(url);
            const expires = parseInt(parsedUrl.searchParams.get('expires') || '0');
            const signature = parsedUrl.searchParams.get('signature') || '';
            const apiKey = parsedUrl.searchParams.get('apiKey') || '';
            const currentTime = Math.floor(Date.now() / 1000);
            if (currentTime > expires) {
                return { valid: false, reason: 'URL expired' };
            }
            parsedUrl.searchParams.delete('signature');
            const message = `${parsedUrl.pathname}${parsedUrl.search}:${expires}`;
            const isValid = crypto_service_1.cryptoService.verifyHMAC(message, signature, apiSecret);
            return { valid: isValid, reason: isValid ? undefined : 'Invalid signature' };
        }
        catch (error) {
            logger_1.logger.error('Signed URL verification error', error);
            return { valid: false, reason: 'Invalid URL format' };
        }
    }
}
exports.HMACService = HMACService;
exports.hmacService = HMACService.getInstance();
//# sourceMappingURL=hmac.service.js.map