/**
 * TEST SETUP CONFIGURATION
 * 
 * Global test setup for Jest integration tests with comprehensive mocking
 */

import { beforeAll, afterAll, afterEach } from '@jest/globals';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/finishthisidea_test';
process.env.REDIS_URL = 'redis://localhost:6379/1'; // Use DB 1 for tests
process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';
process.env.LOG_LEVEL = 'error'; // Reduce noise in tests
process.env.ENABLE_MONITORING = 'false';
process.env.ENABLE_TRUST_TIERS = 'true';
process.env.S3_BUCKET = 'test-bucket';

// Mock Redis if not available
jest.mock('../config/redis', () => {
  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    keys: jest.fn().mockResolvedValue([]),
    ttl: jest.fn().mockResolvedValue(-1),
    expire: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    client: {
      startTransaction: jest.fn().mockReturnValue({
        commit: jest.fn().mockResolvedValue(true),
        rollback: jest.fn().mockResolvedValue(true)
      })
    }
  };
  return { default: mockRedis };
});

// Mock Prisma client
jest.mock('../config/database', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    project: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    promptBundle: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  }
}));

// Mock AWS S3 (only if aws-sdk is available)
jest.mock('aws-sdk', () => ({
  S3: jest.fn(() => ({
    upload: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Location: 'https://test-bucket.s3.amazonaws.com/test-file.zip',
        Key: 'test-file.zip'
      })
    }),
    deleteObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    }),
    getSignedUrl: jest.fn().mockReturnValue('https://signed-url.com')
  }))
}), { virtual: true });

// Mock Winston logger
jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
  logSecurity: jest.fn(),
}));

// Mock metrics service
jest.mock('../services/monitoring/metrics.service', () => ({
  MetricsService: {
    getInstance: jest.fn().mockReturnValue({
      recordMetric: jest.fn().mockResolvedValue(undefined),
      getSystemMetrics: jest.fn().mockResolvedValue({
        uptime: 1000,
        memory: { used: 100, total: 1000 },
        cpu: 50
      }),
      exportPrometheusMetrics: jest.fn().mockResolvedValue('# Test metrics')
    })
  }
}), { virtual: true });

// Mock presence logger (virtual module)
jest.mock('../monitoring/presence-logger', () => ({
  logUserAction: jest.fn().mockResolvedValue(undefined),
  logSystemEvent: jest.fn().mockResolvedValue(undefined),
}), { virtual: true });

// Mock AI services (virtual module)
jest.mock('../services/ai-router.service', () => ({
  AIRouterService: {
    getInstance: jest.fn().mockReturnValue({
      routeRequest: jest.fn().mockResolvedValue({
        provider: 'ollama',
        response: 'Test AI response',
        tokensUsed: 100
      })
    })
  }
}), { virtual: true });

// Mock external services for testing
beforeAll(async () => {
  // Mock Stripe
  jest.mock('stripe', () => {
    return jest.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue({
            id: 'cs_test_123',
            url: 'https://checkout.stripe.com/pay/cs_test_123',
            payment_intent: 'pi_test_123'
          })
        }
      }
    }));
  });

  // Mock external API calls
  global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  
  // Mock successful health check responses
  (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation(
    async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/health') || url.includes('/api/tags')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          body: null,
          bodyUsed: false,
          type: 'basic',
          url,
          redirected: false,
          text: async () => JSON.stringify({ status: 'healthy' }),
          json: async () => ({ status: 'healthy' }),
          blob: async () => new Blob([]),
          arrayBuffer: async () => new ArrayBuffer(0),
          formData: async () => new FormData(),
          clone: () => ({ text: async () => '{}' } as Response)
        } as unknown as Response);
      }
      
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        body: null,
        bodyUsed: false,
        type: 'basic',
        url,
        redirected: false,
        text: async () => JSON.stringify({ success: true }),
        json: async () => ({ success: true }),
        blob: async () => new Blob([]),
        arrayBuffer: async () => new ArrayBuffer(0),
        formData: async () => new FormData(),
        clone: () => ({ text: async () => '{}' } as Response)
      } as unknown as Response);
    }
  );

  console.log('🧪 Test environment initialized');
});

// Clean up after each test
afterEach(async () => {
  jest.clearAllMocks();
});

afterAll(async () => {
  // Close database connections
  try {
    const { prisma } = await import('../config/database');
    await prisma.$disconnect();
  } catch (error) {
    // Database config might not exist in test environment
    console.log('Database disconnect skipped in test environment');
  }
  
  console.log('🧪 Test cleanup completed');
});

// Export test utilities
export const testUtils = {
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    platformTokens: 100,
    trustTier: 'SEEDLING',
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  
  createMockProject: () => ({
    id: 'test-project-id',
    title: 'Test Project',
    description: 'Test Description',
    userId: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  
  createMockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: testUtils.createMockUser(),
    ...overrides
  }),
  
  createMockResponse: () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
  },
  
  createMockNext: () => jest.fn(),
  
  // Database test utilities
  async cleanupDatabase() {
    try {
      // Clean up test data in proper order due to foreign key constraints
      // Note: These would be actual Prisma model names from your schema
      // await prisma.transaction.deleteMany({});
      // await prisma.promptBundle.deleteMany({});
      // await prisma.project.deleteMany({});
      // await prisma.user.deleteMany({});
      console.log('Database cleanup would be performed here');
    } catch (error) {
      console.log('Database cleanup skipped in test environment');
    }
  },
  
  // Redis test utilities
  async cleanupRedis() {
    try {
      const redis = await import('../config/redis');
      const keys = await redis.default.keys('test:*');
      if (keys.length > 0) {
        await redis.default.del(...keys);
      }
    } catch (error) {
      console.log('Redis cleanup skipped in test environment');
    }
  }
};