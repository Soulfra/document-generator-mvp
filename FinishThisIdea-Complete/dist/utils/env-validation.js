"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
exports.validateEnvironment = validateEnvironment;
exports.requireEnv = requireEnv;
exports.isFeatureEnabled = isFeatureEnabled;
exports.getLLMConfig = getLLMConfig;
exports.getStorageConfig = getStorageConfig;
exports.getCorsOrigins = getCorsOrigins;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./logger");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.string().default('3001'),
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    REDIS_URL: zod_1.z.string().default('redis://localhost:6379'),
    S3_BUCKET: zod_1.z.string().min(1, 'S3_BUCKET is required'),
    S3_REGION: zod_1.z.string().default('us-east-1'),
    AWS_ACCESS_KEY_ID: zod_1.z.string().optional(),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().optional(),
    STRIPE_SECRET_KEY: zod_1.z.string().optional(),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string().optional(),
    ANTHROPIC_API_KEY: zod_1.z.string().optional(),
    OPENAI_API_KEY: zod_1.z.string().optional(),
    AZURE_OPENAI_API_KEY: zod_1.z.string().optional(),
    AZURE_OPENAI_ENDPOINT: zod_1.z.string().optional(),
    OLLAMA_BASE_URL: zod_1.z.string().default('http://localhost:11434'),
    JWT_SECRET: zod_1.z.string()
        .min(32, 'JWT_SECRET must be at least 32 characters long')
        .default('default-jwt-secret-change-in-production'),
    JWT_EXPIRY: zod_1.z.string().default('24h'),
    BCRYPT_ROUNDS: zod_1.z.string().transform(val => parseInt(val)).pipe(zod_1.z.number().min(10).max(15)).default('12'),
    ENCRYPTION_KEY: zod_1.z.string().optional(),
    INTERNAL_API_KEY: zod_1.z.string().optional(),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().transform(val => parseInt(val)).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().transform(val => parseInt(val)).default('100'),
    FRONTEND_URL: zod_1.z.string().default('http://localhost:3000'),
    DOMAIN: zod_1.z.string().optional(),
    CORS_ORIGINS: zod_1.z.string().default('http://localhost:3000,https://finishthisidea.com'),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.string().transform(val => parseInt(val)).optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    FROM_EMAIL: zod_1.z.string().email().optional(),
    MAX_FILE_SIZE: zod_1.z.string().transform(val => parseInt(val)).default('104857600'),
    ALLOWED_FILE_TYPES: zod_1.z.string().default('zip,js,ts,jsx,tsx,py,java,cpp,c,html,css,json,md,txt'),
    PLATFORM_NAME: zod_1.z.string().default('FinishThisIdea'),
    SUPPORT_EMAIL: zod_1.z.string().email().default('support@finishthisidea.com'),
    ENABLE_MONITORING: zod_1.z.string().transform(val => val === 'true').default('true'),
    ENABLE_TRUST_TIERS: zod_1.z.string().transform(val => val === 'true').default('true'),
    ENABLE_BACKUPS: zod_1.z.string().transform(val => val === 'true').default('true'),
    BACKUP_RETENTION_DAYS: zod_1.z.string().transform(val => parseInt(val)).default('30'),
    ENABLE_OLLAMA: zod_1.z.string().transform(val => val === 'true').default('true'),
    ENABLE_OPENAI: zod_1.z.string().transform(val => val === 'true').default('false'),
    ENABLE_ANTHROPIC: zod_1.z.string().transform(val => val === 'true').default('false'),
    ENABLE_STRIPE: zod_1.z.string().transform(val => val === 'true').default('false'),
    ENABLE_EMAIL: zod_1.z.string().transform(val => val === 'true').default('false'),
    DIVIDEND_RATE: zod_1.z.string().transform(val => parseFloat(val)).pipe(zod_1.z.number().min(0).max(1)).default('0.3'),
    INITIAL_PLATFORM_TOKENS: zod_1.z.string().transform(val => parseInt(val)).default('100'),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});
function validateEnvironment() {
    try {
        const env = envSchema.parse(process.env);
        if (env.NODE_ENV === 'production') {
            validateProductionEnvironment(env);
        }
        const safeEnv = sanitizeEnvForLogging(env);
        logger_1.logger.info('Environment configuration loaded', safeEnv);
        if (!env.ANTHROPIC_API_KEY && !env.OPENAI_API_KEY && !env.AZURE_OPENAI_API_KEY) {
            logger_1.logger.warn('No AI provider API keys set - only Ollama will be available');
        }
        logger_1.logger.info('Environment validation successful', {
            environment: env.NODE_ENV,
            port: env.PORT,
            features: {
                monitoring: env.ENABLE_MONITORING,
                trustTiers: env.ENABLE_TRUST_TIERS,
                backups: env.ENABLE_BACKUPS
            }
        });
        return env;
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            logger_1.logger.error('Environment validation failed:', {
                errors: error.errors.map(e => ({
                    path: e.path.join('.'),
                    message: e.message
                }))
            });
            console.error('\n❌ Environment Configuration Error\n');
            error.errors.forEach(e => {
                console.error(`   - ${e.path.join('.')}: ${e.message}`);
            });
            console.error('\nPlease check your .env file and ensure all required variables are set.\n');
        }
        else {
            logger_1.logger.error('Environment validation error:', error);
        }
        process.exit(1);
    }
}
exports.env = validateEnvironment();
function validateProductionEnvironment(env) {
    const productionRequirements = [
        { field: 'JWT_SECRET', value: env.JWT_SECRET, check: (v) => v !== 'default-jwt-secret-change-in-production' },
        { field: 'DATABASE_URL', value: env.DATABASE_URL, check: (v) => !v.includes('localhost') },
        { field: 'DOMAIN', value: env.DOMAIN, check: (v) => !!v },
    ];
    const violations = productionRequirements.filter(req => !req.check(req.value));
    if (violations.length > 0) {
        logger_1.logger.error('Production environment validation failed', {
            violations: violations.map(v => v.field)
        });
        console.error('\n🚨 Production Environment Issues:');
        violations.forEach(violation => {
            console.error(`  ❌ ${violation.field}: Not configured for production`);
        });
        console.error('\nProduction deployment requires proper configuration of the above fields.\n');
        throw new Error('Production environment validation failed');
    }
    if (env.ENABLE_STRIPE && !env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is required when ENABLE_STRIPE is true');
    }
    if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
        logger_1.logger.warn('AWS credentials not set - using instance profile or local storage');
    }
}
function sanitizeEnvForLogging(env) {
    const secretFields = [
        'JWT_SECRET',
        'ANTHROPIC_API_KEY',
        'OPENAI_API_KEY',
        'AZURE_OPENAI_API_KEY',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'AWS_SECRET_ACCESS_KEY',
        'SMTP_PASS',
        'DATABASE_URL',
        'ENCRYPTION_KEY',
        'INTERNAL_API_KEY'
    ];
    const sanitized = {};
    for (const [key, value] of Object.entries(env)) {
        if (secretFields.includes(key)) {
            if (typeof value === 'string' && value.length > 8) {
                sanitized[key] = `${value.slice(0, 4)}****${value.slice(-4)}`;
            }
            else {
                sanitized[key] = '****';
            }
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
function requireEnv(key) {
    const value = exports.env[key];
    if (value === undefined || value === null || value === '') {
        throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
}
function isFeatureEnabled(feature) {
    switch (feature) {
        case 'monitoring': return exports.env.ENABLE_MONITORING;
        case 'trustTiers': return exports.env.ENABLE_TRUST_TIERS;
        case 'backups': return exports.env.ENABLE_BACKUPS;
        case 'ollama': return exports.env.ENABLE_OLLAMA;
        case 'openai': return exports.env.ENABLE_OPENAI;
        case 'anthropic': return exports.env.ENABLE_ANTHROPIC;
        case 'stripe': return exports.env.ENABLE_STRIPE;
        case 'email': return exports.env.ENABLE_EMAIL;
        default: return false;
    }
}
function getLLMConfig() {
    return {
        ollama: {
            enabled: exports.env.ENABLE_OLLAMA,
            url: exports.env.OLLAMA_BASE_URL
        },
        openai: {
            enabled: exports.env.ENABLE_OPENAI,
            apiKey: exports.env.OPENAI_API_KEY
        },
        anthropic: {
            enabled: exports.env.ENABLE_ANTHROPIC,
            apiKey: exports.env.ANTHROPIC_API_KEY
        },
        azure: {
            enabled: !!(exports.env.AZURE_OPENAI_API_KEY && exports.env.AZURE_OPENAI_ENDPOINT),
            apiKey: exports.env.AZURE_OPENAI_API_KEY,
            endpoint: exports.env.AZURE_OPENAI_ENDPOINT
        }
    };
}
function getStorageConfig() {
    return {
        aws: {
            accessKeyId: exports.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: exports.env.AWS_SECRET_ACCESS_KEY,
            region: exports.env.S3_REGION,
            bucket: exports.env.S3_BUCKET
        },
        maxFileSize: exports.env.MAX_FILE_SIZE,
        allowedFileTypes: exports.env.ALLOWED_FILE_TYPES.split(',').map(type => type.trim())
    };
}
function getCorsOrigins() {
    return exports.env.CORS_ORIGINS.split(',').map(origin => origin.trim());
}
//# sourceMappingURL=env-validation.js.map