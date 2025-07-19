"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.security = exports.secretsConfig = exports.securityHeaders = exports.securityPolicies = exports.securityFeatures = void 0;
exports.validateSecurityConfig = validateSecurityConfig;
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
(0, dotenv_1.config)();
const securityEnvSchema = zod_1.z.object({
    MASTER_SECRET: zod_1.z.string().min(32).default('change-this-master-secret-in-production-please'),
    ENCRYPTION_KEY: zod_1.z.string().min(32).optional(),
    SESSION_SECRET: zod_1.z.string().min(32),
    SESSION_COOKIE_NAME: zod_1.z.string().default('finishthisidea.sid'),
    SESSION_TIMEOUT: zod_1.z.string().transform(Number).default('3600'),
    SESSION_MAX_AGE: zod_1.z.string().transform(Number).default('86400'),
    CSRF_TOKEN_LENGTH: zod_1.z.string().transform(Number).default('32'),
    CSRF_TOKEN_TTL: zod_1.z.string().transform(Number).default('3600'),
    API_KEY_PREFIX: zod_1.z.string().default('sk'),
    API_KEY_TEST_PREFIX: zod_1.z.string().default('sk-test'),
    API_KEY_ROTATION_DAYS: zod_1.z.string().transform(Number).default('90'),
    API_REQUEST_SIGNATURE_MAX_AGE: zod_1.z.string().transform(Number).default('300'),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().transform(Number).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().transform(Number).default('100'),
    RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: zod_1.z.boolean().default(false),
    RATE_LIMIT_SKIP_FAILED_REQUESTS: zod_1.z.boolean().default(false),
    PASSWORD_MIN_LENGTH: zod_1.z.string().transform(Number).default('8'),
    PASSWORD_REQUIRE_UPPERCASE: zod_1.z.boolean().default(true),
    PASSWORD_REQUIRE_LOWERCASE: zod_1.z.boolean().default(true),
    PASSWORD_REQUIRE_NUMBERS: zod_1.z.boolean().default(true),
    PASSWORD_REQUIRE_SYMBOLS: zod_1.z.boolean().default(true),
    PASSWORD_SALT_ROUNDS: zod_1.z.string().transform(Number).default('10'),
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32).optional(),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('30d'),
    WEBHOOK_SECRET_STRIPE: zod_1.z.string().optional(),
    WEBHOOK_SECRET_GITHUB: zod_1.z.string().optional(),
    WEBHOOK_SIGNATURE_MAX_AGE: zod_1.z.string().transform(Number).default('300'),
    HSTS_MAX_AGE: zod_1.z.string().transform(Number).default('31536000'),
    CSP_REPORT_URI: zod_1.z.string().optional(),
    ALLOWED_ORIGINS: zod_1.z.string().transform(val => val.split(',')).default('http://localhost:3000'),
    SECRETS_STORAGE_BACKEND: zod_1.z.enum(['redis', 'file', 'memory']).default('redis'),
    SECRETS_ENCRYPTION_ENABLED: zod_1.z.boolean().default(true),
    SECRETS_ROTATION_CHECK_INTERVAL: zod_1.z.string().transform(Number).default('3600000'),
    SECRETS_DEFAULT_TTL: zod_1.z.string().transform(Number).default('0'),
    MAX_REQUEST_SIZE: zod_1.z.string().default('10mb'),
    MAX_FILE_SIZE: zod_1.z.string().transform(Number).default('52428800'),
    ALLOWED_FILE_TYPES: zod_1.z.string().transform(val => val.split(',')).default('.jpg,.png,.pdf,.zip'),
    AUDIT_LOG_ENABLED: zod_1.z.boolean().default(true),
    AUDIT_LOG_RETENTION_DAYS: zod_1.z.string().transform(Number).default('90'),
    SECURITY_MONITORING_ENABLED: zod_1.z.boolean().default(true),
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    SECURE_COOKIES: zod_1.z.boolean().default(false),
    TRUST_PROXY: zod_1.z.boolean().default(false),
});
let securityConfig;
try {
    securityConfig = securityEnvSchema.parse(process.env);
}
catch (error) {
    logger_1.logger.error('Invalid security configuration', error);
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Security configuration validation failed');
    }
    else {
        logger_1.logger.warn('Using default security configuration - NOT SAFE FOR PRODUCTION');
        securityConfig = securityEnvSchema.parse({});
    }
}
exports.securityFeatures = {
    mfaEnabled: process.env.MFA_ENABLED === 'true',
    ssoEnabled: process.env.SSO_ENABLED === 'true',
    apiKeyAuthEnabled: true,
    sessionAuthEnabled: true,
    csrfProtection: true,
    requestSigning: process.env.REQUEST_SIGNING_ENABLED !== 'false',
    webhookValidation: true,
    inputSanitization: true,
    outputEncoding: true,
    auditLogging: securityConfig.AUDIT_LOG_ENABLED,
    complianceMode: process.env.COMPLIANCE_MODE === 'true',
    gdprEnabled: process.env.GDPR_ENABLED !== 'false',
    ccpaEnabled: process.env.CCPA_ENABLED !== 'false',
    anomalyDetection: process.env.ANOMALY_DETECTION === 'true',
    honeypotEndpoints: process.env.HONEYPOT_ENABLED === 'true',
    shadowBanning: process.env.SHADOW_BAN_ENABLED === 'true',
    debugMode: process.env.DEBUG === 'true' && process.env.NODE_ENV !== 'production',
    verboseErrors: process.env.NODE_ENV !== 'production',
    swaggerEnabled: process.env.SWAGGER_ENABLED !== 'false' && process.env.NODE_ENV !== 'production'
};
exports.securityPolicies = {
    password: {
        minLength: securityConfig.PASSWORD_MIN_LENGTH,
        requireUppercase: securityConfig.PASSWORD_REQUIRE_UPPERCASE,
        requireLowercase: securityConfig.PASSWORD_REQUIRE_LOWERCASE,
        requireNumbers: securityConfig.PASSWORD_REQUIRE_NUMBERS,
        requireSymbols: securityConfig.PASSWORD_REQUIRE_SYMBOLS,
        saltRounds: securityConfig.PASSWORD_SALT_ROUNDS
    },
    session: {
        timeout: securityConfig.SESSION_TIMEOUT * 1000,
        maxAge: securityConfig.SESSION_MAX_AGE * 1000,
        cookieName: securityConfig.SESSION_COOKIE_NAME,
        secure: securityConfig.SECURE_COOKIES,
        sameSite: securityConfig.NODE_ENV === 'production' ? 'strict' : 'lax'
    },
    apiKey: {
        prefix: securityConfig.API_KEY_PREFIX,
        testPrefix: securityConfig.API_KEY_TEST_PREFIX,
        rotationDays: securityConfig.API_KEY_ROTATION_DAYS,
        autoRotate: true
    },
    rateLimit: {
        windowMs: securityConfig.RATE_LIMIT_WINDOW_MS,
        max: securityConfig.RATE_LIMIT_MAX_REQUESTS,
        skipSuccessfulRequests: securityConfig.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS,
        skipFailedRequests: securityConfig.RATE_LIMIT_SKIP_FAILED_REQUESTS
    },
    fileUpload: {
        maxSize: securityConfig.MAX_FILE_SIZE,
        allowedTypes: securityConfig.ALLOWED_FILE_TYPES,
        scanForViruses: process.env.VIRUS_SCAN_ENABLED === 'true',
        quarantineEnabled: process.env.QUARANTINE_ENABLED === 'true'
    }
};
exports.securityHeaders = {
    hsts: {
        maxAge: securityConfig.HSTS_MAX_AGE,
        includeSubDomains: true,
        preload: true
    },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            reportUri: securityConfig.CSP_REPORT_URI
        }
    },
    cors: {
        origin: securityConfig.ALLOWED_ORIGINS,
        credentials: true,
        optionsSuccessStatus: 200
    },
    referrerPolicy: 'strict-origin-when-cross-origin',
    xContentTypeOptions: 'nosniff',
    xFrameOptions: 'DENY',
    xXssProtection: '1; mode=block',
    permissionsPolicy: {
        features: {
            camera: ["'none'"],
            microphone: ["'none'"],
            geolocation: ["'none'"],
            payment: ["'self'"]
        }
    }
};
exports.secretsConfig = {
    masterSecret: securityConfig.MASTER_SECRET,
    encryptionKey: securityConfig.ENCRYPTION_KEY || securityConfig.MASTER_SECRET,
    sessionSecret: securityConfig.SESSION_SECRET,
    jwtSecret: securityConfig.JWT_SECRET,
    jwtRefreshSecret: securityConfig.JWT_REFRESH_SECRET || securityConfig.JWT_SECRET,
    webhooks: {
        stripe: securityConfig.WEBHOOK_SECRET_STRIPE,
        github: securityConfig.WEBHOOK_SECRET_GITHUB
    }
};
exports.security = {
    config: securityConfig,
    features: exports.securityFeatures,
    policies: exports.securityPolicies,
    headers: exports.securityHeaders,
    secrets: exports.secretsConfig
};
function validateSecurityConfig() {
    const issues = [];
    if (process.env.NODE_ENV === 'production') {
        if (securityConfig.MASTER_SECRET === 'change-this-master-secret-in-production-please') {
            issues.push('MASTER_SECRET must be changed in production');
        }
        if (!securityConfig.SECURE_COOKIES) {
            issues.push('SECURE_COOKIES should be enabled in production');
        }
        if (exports.securityFeatures.debugMode) {
            issues.push('Debug mode should be disabled in production');
        }
        if (exports.securityFeatures.swaggerEnabled) {
            issues.push('Swagger should be disabled in production');
        }
    }
    if (securityConfig.PASSWORD_MIN_LENGTH < 8) {
        issues.push('Password minimum length should be at least 8 characters');
    }
    if (securityConfig.SESSION_TIMEOUT > 3600) {
        issues.push('Session timeout might be too long');
    }
    if (issues.length > 0) {
        logger_1.logger.warn('Security configuration issues detected:', issues);
        if (process.env.NODE_ENV === 'production' && process.env.STRICT_SECURITY === 'true') {
            throw new Error('Security configuration validation failed');
        }
    }
    else {
        logger_1.logger.info('Security configuration validated successfully');
    }
}
exports.default = exports.security;
//# sourceMappingURL=security.config.js.map