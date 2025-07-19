import { z } from 'zod';
import dotenv from 'dotenv';
import { logger } from './logger';

// Load environment variables
dotenv.config();

// Define environment schema
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3001'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // AWS S3
  S3_BUCKET: z.string().min(1, 'S3_BUCKET is required'),
  S3_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // AI Services
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_ENDPOINT: z.string().optional(),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  
  // Security
  JWT_SECRET: z.string()
    .min(32, 'JWT_SECRET must be at least 32 characters long')
    .default('default-jwt-secret-change-in-production'),
  JWT_EXPIRY: z.string().default('24h'),
  BCRYPT_ROUNDS: z.string().transform(val => parseInt(val)).pipe(z.number().min(10).max(15)).default('12'),
  ENCRYPTION_KEY: z.string().optional(),
  INTERNAL_API_KEY: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(val => parseInt(val)).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(val => parseInt(val)).default('100'),
  
  // Frontend
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  DOMAIN: z.string().optional(),
  CORS_ORIGINS: z.string().default('http://localhost:3000,https://finishthisidea.com'),
  
  // Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(val => parseInt(val)).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  
  // File Upload Configuration
  MAX_FILE_SIZE: z.string().transform(val => parseInt(val)).default('104857600'), // 100MB
  ALLOWED_FILE_TYPES: z.string().default('zip,js,ts,jsx,tsx,py,java,cpp,c,html,css,json,md,txt'),
  
  // Platform Configuration
  PLATFORM_NAME: z.string().default('FinishThisIdea'),
  SUPPORT_EMAIL: z.string().email().default('support@finishthisidea.com'),
  
  // Features
  ENABLE_MONITORING: z.string().transform(val => val === 'true').default('true'),
  ENABLE_TRUST_TIERS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_BACKUPS: z.string().transform(val => val === 'true').default('true'),
  BACKUP_RETENTION_DAYS: z.string().transform(val => parseInt(val)).default('30'),
  ENABLE_OLLAMA: z.string().transform(val => val === 'true').default('true'),
  ENABLE_OPENAI: z.string().transform(val => val === 'true').default('false'),
  ENABLE_ANTHROPIC: z.string().transform(val => val === 'true').default('false'),
  ENABLE_STRIPE: z.string().transform(val => val === 'true').default('false'),
  ENABLE_EMAIL: z.string().transform(val => val === 'true').default('false'),
  
  // Treasury Configuration
  DIVIDEND_RATE: z.string().transform(val => parseFloat(val)).pipe(z.number().min(0).max(1)).default('0.3'),
  INITIAL_PLATFORM_TOKENS: z.string().transform(val => parseInt(val)).default('100'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Validate environment
export function validateEnvironment() {
  try {
    const env = envSchema.parse(process.env);
    
    // Additional validation
    if (env.NODE_ENV === 'production') {
      validateProductionEnvironment(env);
    }
    
    // Log environment configuration (without secrets)
    const safeEnv = sanitizeEnvForLogging(env);
    logger.info('Environment configuration loaded', safeEnv);
    
    // Warn about missing AI providers
    if (!env.ANTHROPIC_API_KEY && !env.OPENAI_API_KEY && !env.AZURE_OPENAI_API_KEY) {
      logger.warn('No AI provider API keys set - only Ollama will be available');
    }
    
    logger.info('Environment validation successful', {
      environment: env.NODE_ENV,
      port: env.PORT,
      features: {
        monitoring: env.ENABLE_MONITORING,
        trustTiers: env.ENABLE_TRUST_TIERS,
        backups: env.ENABLE_BACKUPS
      }
    });
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Environment validation failed:', {
        errors: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
      
      // Print helpful error message
      console.error('\n❌ Environment Configuration Error\n');
      error.errors.forEach(e => {
        console.error(`   - ${e.path.join('.')}: ${e.message}`);
      });
      console.error('\nPlease check your .env file and ensure all required variables are set.\n');
    } else {
      logger.error('Environment validation error:', error);
    }
    
    process.exit(1);
  }
}

// Export validated environment
export const env = validateEnvironment();

// Type-safe environment access
export type ValidatedEnv = z.infer<typeof envSchema>;

/**
 * Additional validation for production environment
 */
function validateProductionEnvironment(env: ValidatedEnv): void {
  const productionRequirements = [
    { field: 'JWT_SECRET', value: env.JWT_SECRET, check: (v: string) => v !== 'default-jwt-secret-change-in-production' },
    { field: 'DATABASE_URL', value: env.DATABASE_URL, check: (v: string) => !v.includes('localhost') },
    { field: 'DOMAIN', value: env.DOMAIN, check: (v?: string) => !!v },
  ];
  
  const violations = productionRequirements.filter(req => !req.check(req.value));
  
  if (violations.length > 0) {
    logger.error('Production environment validation failed', {
      violations: violations.map(v => v.field)
    });
    
    console.error('\n🚨 Production Environment Issues:');
    violations.forEach(violation => {
      console.error(`  ❌ ${violation.field}: Not configured for production`);
    });
    console.error('\nProduction deployment requires proper configuration of the above fields.\n');
    
    throw new Error('Production environment validation failed');
  }
  
  // Additional production checks
  if (env.ENABLE_STRIPE && !env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is required when ENABLE_STRIPE is true');
  }
  
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    logger.warn('AWS credentials not set - using instance profile or local storage');
  }
}

/**
 * Sanitize environment for logging (hide secrets)
 */
function sanitizeEnvForLogging(env: ValidatedEnv): Record<string, any> {
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
  
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(env)) {
    if (secretFields.includes(key)) {
      if (typeof value === 'string' && value.length > 8) {
        sanitized[key] = `${value.slice(0, 4)}****${value.slice(-4)}`;
      } else {
        sanitized[key] = '****';
      }
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Get required environment variables with validation
 */
export function requireEnv(key: keyof ValidatedEnv): NonNullable<ValidatedEnv[typeof key]> {
  const value = env[key];
  if (value === undefined || value === null || value === '') {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value as NonNullable<ValidatedEnv[typeof key]>;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: 'monitoring' | 'trustTiers' | 'backups' | 'ollama' | 'openai' | 'anthropic' | 'stripe' | 'email'): boolean {
  switch (feature) {
    case 'monitoring': return env.ENABLE_MONITORING;
    case 'trustTiers': return env.ENABLE_TRUST_TIERS;
    case 'backups': return env.ENABLE_BACKUPS;
    case 'ollama': return env.ENABLE_OLLAMA;
    case 'openai': return env.ENABLE_OPENAI;
    case 'anthropic': return env.ENABLE_ANTHROPIC;
    case 'stripe': return env.ENABLE_STRIPE;
    case 'email': return env.ENABLE_EMAIL;
    default: return false;
  }
}

/**
 * Get LLM provider configuration
 */
export function getLLMConfig() {
  return {
    ollama: {
      enabled: env.ENABLE_OLLAMA,
      url: env.OLLAMA_BASE_URL
    },
    openai: {
      enabled: env.ENABLE_OPENAI,
      apiKey: env.OPENAI_API_KEY
    },
    anthropic: {
      enabled: env.ENABLE_ANTHROPIC,
      apiKey: env.ANTHROPIC_API_KEY
    },
    azure: {
      enabled: !!(env.AZURE_OPENAI_API_KEY && env.AZURE_OPENAI_ENDPOINT),
      apiKey: env.AZURE_OPENAI_API_KEY,
      endpoint: env.AZURE_OPENAI_ENDPOINT
    }
  };
}

/**
 * Get storage configuration
 */
export function getStorageConfig() {
  return {
    aws: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.S3_REGION,
      bucket: env.S3_BUCKET
    },
    maxFileSize: env.MAX_FILE_SIZE,
    allowedFileTypes: env.ALLOWED_FILE_TYPES.split(',').map(type => type.trim())
  };
}

/**
 * Get CORS origins as array
 */
export function getCorsOrigins(): string[] {
  return env.CORS_ORIGINS.split(',').map(origin => origin.trim());
}