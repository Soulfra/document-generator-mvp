/**
 * Centralized Security Configuration
 * All security-related settings in one place
 */

import { config } from 'dotenv';
import { z } from 'zod';
import { logger } from '../utils/logger';

// Load environment variables
config();

/**
 * Security environment schema
 */
const securityEnvSchema = z.object({
  // Master Keys
  MASTER_SECRET: z.string().min(32).default('change-this-master-secret-in-production-please'),
  ENCRYPTION_KEY: z.string().min(32).optional(),
  
  // Session Security
  SESSION_SECRET: z.string().min(32),
  SESSION_COOKIE_NAME: z.string().default('finishthisidea.sid'),
  SESSION_TIMEOUT: z.string().transform(Number).default('3600'), // 1 hour
  SESSION_MAX_AGE: z.string().transform(Number).default('86400'), // 24 hours
  
  // CSRF Protection
  CSRF_TOKEN_LENGTH: z.string().transform(Number).default('32'),
  CSRF_TOKEN_TTL: z.string().transform(Number).default('3600'), // 1 hour
  
  // API Security
  API_KEY_PREFIX: z.string().default('sk'),
  API_KEY_TEST_PREFIX: z.string().default('sk-test'),
  API_KEY_ROTATION_DAYS: z.string().transform(Number).default('90'),
  API_REQUEST_SIGNATURE_MAX_AGE: z.string().transform(Number).default('300'), // 5 minutes
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: z.boolean().default(false),
  RATE_LIMIT_SKIP_FAILED_REQUESTS: z.boolean().default(false),
  
  // Password Policy
  PASSWORD_MIN_LENGTH: z.string().transform(Number).default('8'),
  PASSWORD_REQUIRE_UPPERCASE: z.boolean().default(true),
  PASSWORD_REQUIRE_LOWERCASE: z.boolean().default(true),
  PASSWORD_REQUIRE_NUMBERS: z.boolean().default(true),
  PASSWORD_REQUIRE_SYMBOLS: z.boolean().default(true),
  PASSWORD_SALT_ROUNDS: z.string().transform(Number).default('10'),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  // Webhook Security
  WEBHOOK_SECRET_STRIPE: z.string().optional(),
  WEBHOOK_SECRET_GITHUB: z.string().optional(),
  WEBHOOK_SIGNATURE_MAX_AGE: z.string().transform(Number).default('300'), // 5 minutes
  
  // Security Headers
  HSTS_MAX_AGE: z.string().transform(Number).default('31536000'), // 1 year
  CSP_REPORT_URI: z.string().optional(),
  ALLOWED_ORIGINS: z.string().transform(val => val.split(',')).default('http://localhost:3000'),
  
  // Secrets Management
  SECRETS_STORAGE_BACKEND: z.enum(['redis', 'file', 'memory']).default('redis'),
  SECRETS_ENCRYPTION_ENABLED: z.boolean().default(true),
  SECRETS_ROTATION_CHECK_INTERVAL: z.string().transform(Number).default('3600000'), // 1 hour
  SECRETS_DEFAULT_TTL: z.string().transform(Number).default('0'), // No expiration
  
  // Input Validation
  MAX_REQUEST_SIZE: z.string().default('10mb'),
  MAX_FILE_SIZE: z.string().transform(Number).default('52428800'), // 50MB
  ALLOWED_FILE_TYPES: z.string().transform(val => val.split(',')).default('.jpg,.png,.pdf,.zip'),
  
  // Audit & Monitoring
  AUDIT_LOG_ENABLED: z.boolean().default(true),
  AUDIT_LOG_RETENTION_DAYS: z.string().transform(Number).default('90'),
  SECURITY_MONITORING_ENABLED: z.boolean().default(true),
  
  // Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SECURE_COOKIES: z.boolean().default(false), // Should be true in production
  TRUST_PROXY: z.boolean().default(false),
});

/**
 * Parse and validate environment variables
 */
let securityConfig: z.infer<typeof securityEnvSchema>;

try {
  securityConfig = securityEnvSchema.parse(process.env);
} catch (error) {
  logger.error('Invalid security configuration', error);
  
  if (process.env.NODE_ENV === 'production') {
    // In production, fail fast on configuration errors
    throw new Error('Security configuration validation failed');
  } else {
    // In development, use defaults but warn
    logger.warn('Using default security configuration - NOT SAFE FOR PRODUCTION');
    securityConfig = securityEnvSchema.parse({});
  }
}

/**
 * Security feature flags
 */
export const securityFeatures = {
  // Authentication & Authorization
  mfaEnabled: process.env.MFA_ENABLED === 'true',
  ssoEnabled: process.env.SSO_ENABLED === 'true',
  apiKeyAuthEnabled: true,
  sessionAuthEnabled: true,
  
  // Security Features
  csrfProtection: true,
  requestSigning: process.env.REQUEST_SIGNING_ENABLED !== 'false',
  webhookValidation: true,
  inputSanitization: true,
  outputEncoding: true,
  
  // Monitoring & Compliance
  auditLogging: securityConfig.AUDIT_LOG_ENABLED,
  complianceMode: process.env.COMPLIANCE_MODE === 'true',
  gdprEnabled: process.env.GDPR_ENABLED !== 'false',
  ccpaEnabled: process.env.CCPA_ENABLED !== 'false',
  
  // Advanced Security
  anomalyDetection: process.env.ANOMALY_DETECTION === 'true',
  honeypotEndpoints: process.env.HONEYPOT_ENABLED === 'true',
  shadowBanning: process.env.SHADOW_BAN_ENABLED === 'true',
  
  // Development Features (should be false in production)
  debugMode: process.env.DEBUG === 'true' && process.env.NODE_ENV !== 'production',
  verboseErrors: process.env.NODE_ENV !== 'production',
  swaggerEnabled: process.env.SWAGGER_ENABLED !== 'false' && process.env.NODE_ENV !== 'production'
};

/**
 * Security policies
 */
export const securityPolicies = {
  // Password Policy
  password: {
    minLength: securityConfig.PASSWORD_MIN_LENGTH,
    requireUppercase: securityConfig.PASSWORD_REQUIRE_UPPERCASE,
    requireLowercase: securityConfig.PASSWORD_REQUIRE_LOWERCASE,
    requireNumbers: securityConfig.PASSWORD_REQUIRE_NUMBERS,
    requireSymbols: securityConfig.PASSWORD_REQUIRE_SYMBOLS,
    saltRounds: securityConfig.PASSWORD_SALT_ROUNDS
  },
  
  // Session Policy
  session: {
    timeout: securityConfig.SESSION_TIMEOUT * 1000, // Convert to ms
    maxAge: securityConfig.SESSION_MAX_AGE * 1000,
    cookieName: securityConfig.SESSION_COOKIE_NAME,
    secure: securityConfig.SECURE_COOKIES,
    sameSite: securityConfig.NODE_ENV === 'production' ? 'strict' : 'lax' as const
  },
  
  // API Key Policy
  apiKey: {
    prefix: securityConfig.API_KEY_PREFIX,
    testPrefix: securityConfig.API_KEY_TEST_PREFIX,
    rotationDays: securityConfig.API_KEY_ROTATION_DAYS,
    autoRotate: true
  },
  
  // Rate Limiting Policy
  rateLimit: {
    windowMs: securityConfig.RATE_LIMIT_WINDOW_MS,
    max: securityConfig.RATE_LIMIT_MAX_REQUESTS,
    skipSuccessfulRequests: securityConfig.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS,
    skipFailedRequests: securityConfig.RATE_LIMIT_SKIP_FAILED_REQUESTS
  },
  
  // File Upload Policy
  fileUpload: {
    maxSize: securityConfig.MAX_FILE_SIZE,
    allowedTypes: securityConfig.ALLOWED_FILE_TYPES,
    scanForViruses: process.env.VIRUS_SCAN_ENABLED === 'true',
    quarantineEnabled: process.env.QUARANTINE_ENABLED === 'true'
  }
};

/**
 * Security headers configuration
 */
export const securityHeaders = {
  // HSTS
  hsts: {
    maxAge: securityConfig.HSTS_MAX_AGE,
    includeSubDomains: true,
    preload: true
  },
  
  // CSP
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Tighten in production
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
  
  // CORS
  cors: {
    origin: securityConfig.ALLOWED_ORIGINS,
    credentials: true,
    optionsSuccessStatus: 200
  },
  
  // Other headers
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

/**
 * Secrets configuration
 */
export const secretsConfig = {
  masterSecret: securityConfig.MASTER_SECRET,
  encryptionKey: securityConfig.ENCRYPTION_KEY || securityConfig.MASTER_SECRET,
  sessionSecret: securityConfig.SESSION_SECRET,
  jwtSecret: securityConfig.JWT_SECRET,
  jwtRefreshSecret: securityConfig.JWT_REFRESH_SECRET || securityConfig.JWT_SECRET,
  
  // Webhook secrets
  webhooks: {
    stripe: securityConfig.WEBHOOK_SECRET_STRIPE,
    github: securityConfig.WEBHOOK_SECRET_GITHUB
  }
};

/**
 * Export the complete configuration
 */
export const security = {
  config: securityConfig,
  features: securityFeatures,
  policies: securityPolicies,
  headers: securityHeaders,
  secrets: secretsConfig
};

/**
 * Validate security configuration on startup
 */
export function validateSecurityConfig(): void {
  const issues: string[] = [];
  
  // Check production requirements
  if (process.env.NODE_ENV === 'production') {
    if (securityConfig.MASTER_SECRET === 'change-this-master-secret-in-production-please') {
      issues.push('MASTER_SECRET must be changed in production');
    }
    
    if (!securityConfig.SECURE_COOKIES) {
      issues.push('SECURE_COOKIES should be enabled in production');
    }
    
    if (securityFeatures.debugMode) {
      issues.push('Debug mode should be disabled in production');
    }
    
    if (securityFeatures.swaggerEnabled) {
      issues.push('Swagger should be disabled in production');
    }
  }
  
  // Check for weak configurations
  if (securityConfig.PASSWORD_MIN_LENGTH < 8) {
    issues.push('Password minimum length should be at least 8 characters');
  }
  
  if (securityConfig.SESSION_TIMEOUT > 3600) {
    issues.push('Session timeout might be too long');
  }
  
  if (issues.length > 0) {
    logger.warn('Security configuration issues detected:', issues);
    
    if (process.env.NODE_ENV === 'production' && process.env.STRICT_SECURITY === 'true') {
      throw new Error('Security configuration validation failed');
    }
  } else {
    logger.info('Security configuration validated successfully');
  }
}

// Export for use in other modules
export default security;