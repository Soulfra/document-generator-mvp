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
exports.testUtils = exports.FileUploadTestHelper = exports.PerformanceTestHelper = exports.AssertionHelpers = exports.MockDataFactory = exports.DatabaseTestHelper = exports.APITestHelper = void 0;
const supertest_1 = __importDefault(require("supertest"));
const setup_1 = require("./setup");
Object.defineProperty(exports, "testUtils", { enumerable: true, get: function () { return setup_1.testUtils; } });
class APITestHelper {
    app;
    currentUser;
    constructor(app) {
        this.app = app;
    }
    async loginAs(userData) {
        const user = {
            ...setup_1.testUtils.createMockUser(),
            ...userData
        };
        user.token = `Bearer test-jwt-token-${user.id}`;
        this.currentUser = user;
        return user;
    }
    get(path) {
        const req = (0, supertest_1.default)(this.app).get(path);
        if (this.currentUser?.token) {
            req.set('Authorization', this.currentUser.token);
        }
        return req;
    }
    post(path, data) {
        const req = (0, supertest_1.default)(this.app).post(path);
        if (this.currentUser?.token) {
            req.set('Authorization', this.currentUser.token);
        }
        if (data) {
            req.send(data);
        }
        return req;
    }
    put(path, data) {
        const req = (0, supertest_1.default)(this.app).put(path);
        if (this.currentUser?.token) {
            req.set('Authorization', this.currentUser.token);
        }
        if (data) {
            req.send(data);
        }
        return req;
    }
    delete(path) {
        const req = (0, supertest_1.default)(this.app).delete(path);
        if (this.currentUser?.token) {
            req.set('Authorization', this.currentUser.token);
        }
        return req;
    }
    upload(path, fieldName, filePath) {
        const req = (0, supertest_1.default)(this.app).post(path);
        if (this.currentUser?.token) {
            req.set('Authorization', this.currentUser.token);
        }
        return req.attach(fieldName, filePath);
    }
    logout() {
        this.currentUser = undefined;
    }
    getCurrentUser() {
        return this.currentUser;
    }
}
exports.APITestHelper = APITestHelper;
class DatabaseTestHelper {
    async createTestUser(overrides) {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        const userData = {
            ...setup_1.testUtils.createMockUser(),
            ...overrides
        };
        prisma.user.create.mockResolvedValue(userData);
        return userData;
    }
    async createTestProject(userId, overrides) {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        const projectData = {
            ...setup_1.testUtils.createMockProject(),
            userId,
            ...overrides
        };
        prisma.project.create.mockResolvedValue(projectData);
        return projectData;
    }
    async cleanupTestData() {
        await setup_1.testUtils.cleanupDatabase();
        await setup_1.testUtils.cleanupRedis();
    }
}
exports.DatabaseTestHelper = DatabaseTestHelper;
class MockDataFactory {
    static createUser(overrides) {
        return {
            id: `user-${Date.now()}`,
            email: `test-${Date.now()}@example.com`,
            username: `testuser${Date.now()}`,
            platformTokens: 100,
            trustTier: 'SEEDLING',
            ...overrides
        };
    }
    static createProject(userId, overrides) {
        return {
            id: `project-${Date.now()}`,
            title: `Test Project ${Date.now()}`,
            description: `A test project created at ${new Date().toISOString()}`,
            userId,
            ...overrides
        };
    }
    static createValidProjectData() {
        return {
            title: 'AI-Powered Todo App',
            description: 'A modern todo application with AI features',
            techStack: ['React', 'Node.js', 'PostgreSQL'],
            requirements: [
                'User authentication',
                'Task management',
                'AI-powered suggestions'
            ]
        };
    }
    static createInvalidProjectData() {
        return {
            title: '',
            description: 'x'.repeat(5001),
            techStack: 'not-an-array'
        };
    }
    static createValidUserData() {
        return {
            username: 'testuser123',
            email: 'test@example.com',
            password: 'SecurePassword123!'
        };
    }
    static createInvalidUserData() {
        return {
            username: 'te',
            email: 'invalid-email',
            password: '123'
        };
    }
}
exports.MockDataFactory = MockDataFactory;
class AssertionHelpers {
    static expectSuccessResponse(response, expectedData) {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        if (expectedData) {
            expect(response.body.data).toMatchObject(expectedData);
        }
    }
    static expectErrorResponse(response, expectedStatus, expectedMessage) {
        expect(response.status).toBe(expectedStatus);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        if (expectedMessage) {
            expect(response.body.error).toContain(expectedMessage);
        }
    }
    static expectValidationError(response, field) {
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        if (field) {
            expect(response.body.error).toContain(field);
        }
    }
    static expectAuthenticationError(response) {
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body.error).toContain('Authentication');
    }
    static expectAuthorizationError(response) {
        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body.error).toContain('authorized');
    }
    static expectNotFoundError(response) {
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body.error).toContain('not found');
    }
    static expectRateLimitError(response) {
        expect(response.status).toBe(429);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body.error).toContain('rate limit');
    }
}
exports.AssertionHelpers = AssertionHelpers;
class PerformanceTestHelper {
    static async measureResponseTime(operation) {
        const start = Date.now();
        const result = await operation();
        const duration = Date.now() - start;
        return { result, duration };
    }
    static async runConcurrentRequests(requests, concurrency = 10) {
        const results = [];
        for (let i = 0; i < requests.length; i += concurrency) {
            const batch = requests.slice(i, i + concurrency);
            const batchResults = await Promise.all(batch.map(req => req()));
            results.push(...batchResults);
        }
        return results;
    }
}
exports.PerformanceTestHelper = PerformanceTestHelper;
class FileUploadTestHelper {
    static createMockFile(name, content, mimeType = 'text/plain') {
        return Buffer.from(content);
    }
    static createMockZipFile() {
        return Buffer.from('PK\x03\x04');
    }
    static createMockImageFile() {
        return Buffer.from('\x89PNG\r\n\x1a\n');
    }
}
exports.FileUploadTestHelper = FileUploadTestHelper;
//# sourceMappingURL=test-utils.js.map