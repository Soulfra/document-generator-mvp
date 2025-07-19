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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testUtils = void 0;
const globals_1 = require("@jest/globals");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env.test' });
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/finishthisidea_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';
process.env.LOG_LEVEL = 'error';
process.env.ENABLE_MONITORING = 'false';
process.env.ENABLE_TRUST_TIERS = 'true';
process.env.S3_BUCKET = 'test-bucket';
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
jest.mock('../utils/logger', () => ({
    logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
    },
    logSecurity: jest.fn(),
}));
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
jest.mock('../monitoring/presence-logger', () => ({
    logUserAction: jest.fn().mockResolvedValue(undefined),
    logSystemEvent: jest.fn().mockResolvedValue(undefined),
}), { virtual: true });
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
(0, globals_1.beforeAll)(async () => {
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
    global.fetch = jest.fn();
    global.fetch.mockImplementation(async (input) => {
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
                clone: () => ({ text: async () => '{}' })
            });
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
            clone: () => ({ text: async () => '{}' })
        });
    });
    console.log('🧪 Test environment initialized');
});
(0, globals_1.afterEach)(async () => {
    jest.clearAllMocks();
});
(0, globals_1.afterAll)(async () => {
    try {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        await prisma.$disconnect();
    }
    catch (error) {
        console.log('Database disconnect skipped in test environment');
    }
    console.log('🧪 Test cleanup completed');
});
exports.testUtils = {
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
        user: exports.testUtils.createMockUser(),
        ...overrides
    }),
    createMockResponse: () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        res.send = jest.fn().mockReturnValue(res);
        res.cookie = jest.fn().mockReturnValue(res);
        res.clearCookie = jest.fn().mockReturnValue(res);
        return res;
    },
    createMockNext: () => jest.fn(),
    async cleanupDatabase() {
        try {
            console.log('Database cleanup would be performed here');
        }
        catch (error) {
            console.log('Database cleanup skipped in test environment');
        }
    },
    async cleanupRedis() {
        try {
            const redis = await Promise.resolve().then(() => __importStar(require('../config/redis')));
            const keys = await redis.default.keys('test:*');
            if (keys.length > 0) {
                await redis.default.del(...keys);
            }
        }
        catch (error) {
            console.log('Redis cleanup skipped in test environment');
        }
    }
};
//# sourceMappingURL=setup.js.map