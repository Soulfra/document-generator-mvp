/**
 * COMPREHENSIVE TEST UTILITIES
 * 
 * Testing utilities for API testing with Supertest patterns
 */

import request from 'supertest';
import { Express } from 'express';
import { testUtils } from './setup';

export interface TestUser {
  id: string;
  email: string;
  username: string;
  platformTokens: number;
  trustTier: string;
  token?: string;
}

export interface TestProject {
  id: string;
  title: string;
  description: string;
  userId: string;
}

/**
 * API Test Helper - wraps supertest with authentication
 */
export class APITestHelper {
  private app: Express;
  private currentUser?: TestUser;

  constructor(app: Express) {
    this.app = app;
  }

  /**
   * Authenticate as a test user
   */
  async loginAs(userData?: Partial<TestUser>): Promise<TestUser> {
    const user = {
      ...testUtils.createMockUser(),
      ...userData
    };

    // Mock JWT token
    user.token = `Bearer test-jwt-token-${user.id}`;
    this.currentUser = user;

    return user;
  }

  /**
   * Make authenticated GET request
   */
  get(path: string) {
    const req = request(this.app).get(path);
    if (this.currentUser?.token) {
      req.set('Authorization', this.currentUser.token);
    }
    return req;
  }

  /**
   * Make authenticated POST request
   */
  post(path: string, data?: any) {
    const req = request(this.app).post(path);
    if (this.currentUser?.token) {
      req.set('Authorization', this.currentUser.token);
    }
    if (data) {
      req.send(data);
    }
    return req;
  }

  /**
   * Make authenticated PUT request
   */
  put(path: string, data?: any) {
    const req = request(this.app).put(path);
    if (this.currentUser?.token) {
      req.set('Authorization', this.currentUser.token);
    }
    if (data) {
      req.send(data);
    }
    return req;
  }

  /**
   * Make authenticated DELETE request
   */
  delete(path: string) {
    const req = request(this.app).delete(path);
    if (this.currentUser?.token) {
      req.set('Authorization', this.currentUser.token);
    }
    return req;
  }

  /**
   * Upload file with authentication
   */
  upload(path: string, fieldName: string, filePath: string) {
    const req = request(this.app).post(path);
    if (this.currentUser?.token) {
      req.set('Authorization', this.currentUser.token);
    }
    return req.attach(fieldName, filePath);
  }

  /**
   * Clear current authentication
   */
  logout() {
    this.currentUser = undefined;
  }

  getCurrentUser(): TestUser | undefined {
    return this.currentUser;
  }
}

/**
 * Database Test Helper - handles test data creation and cleanup
 */
export class DatabaseTestHelper {
  async createTestUser(overrides?: Partial<TestUser>): Promise<TestUser> {
    const { prisma } = await import('../config/database');
    
    const userData = {
      ...testUtils.createMockUser(),
      ...overrides
    };

    // Mock the database call
    (prisma.user.create as jest.Mock).mockResolvedValue(userData);
    
    return userData;
  }

  async createTestProject(userId: string, overrides?: Partial<TestProject>): Promise<TestProject> {
    const { prisma } = await import('../config/database');
    
    const projectData = {
      ...testUtils.createMockProject(),
      userId,
      ...overrides
    };

    // Mock the database call
    (prisma.project.create as jest.Mock).mockResolvedValue(projectData);
    
    return projectData;
  }

  async cleanupTestData(): Promise<void> {
    await testUtils.cleanupDatabase();
    await testUtils.cleanupRedis();
  }
}

/**
 * Mock Data Factory - creates realistic test data
 */
export class MockDataFactory {
  static createUser(overrides?: Partial<TestUser>): TestUser {
    return {
      id: `user-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      username: `testuser${Date.now()}`,
      platformTokens: 100,
      trustTier: 'SEEDLING',
      ...overrides
    };
  }

  static createProject(userId: string, overrides?: Partial<TestProject>): TestProject {
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
      title: '', // Invalid: empty title
      description: 'x'.repeat(5001), // Invalid: too long
      techStack: 'not-an-array' // Invalid: should be array
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
      username: 'te', // Invalid: too short
      email: 'invalid-email', // Invalid: not email format
      password: '123' // Invalid: too weak
    };
  }
}

/**
 * Assertion Helpers - common test assertions
 */
export class AssertionHelpers {
  static expectSuccessResponse(response: request.Response, expectedData?: any) {
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    if (expectedData) {
      expect(response.body.data).toMatchObject(expectedData);
    }
  }

  static expectErrorResponse(response: request.Response, expectedStatus: number, expectedMessage?: string) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    if (expectedMessage) {
      expect(response.body.error).toContain(expectedMessage);
    }
  }

  static expectValidationError(response: request.Response, field?: string) {
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    if (field) {
      expect(response.body.error).toContain(field);
    }
  }

  static expectAuthenticationError(response: request.Response) {
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toContain('Authentication');
  }

  static expectAuthorizationError(response: request.Response) {
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toContain('authorized');
  }

  static expectNotFoundError(response: request.Response) {
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toContain('not found');
  }

  static expectRateLimitError(response: request.Response) {
    expect(response.status).toBe(429);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toContain('rate limit');
  }
}

/**
 * Performance Test Helper - for load testing
 */
export class PerformanceTestHelper {
  static async measureResponseTime<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await operation();
    const duration = Date.now() - start;
    return { result, duration };
  }

  static async runConcurrentRequests(requests: (() => Promise<any>)[], concurrency = 10): Promise<any[]> {
    const results = [];
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map(req => req()));
      results.push(...batchResults);
    }
    return results;
  }
}

/**
 * File Upload Test Helper
 */
export class FileUploadTestHelper {
  static createMockFile(name: string, content: string, mimeType = 'text/plain') {
    return Buffer.from(content);
  }

  static createMockZipFile() {
    // Mock ZIP file content
    return Buffer.from('PK\x03\x04'); // ZIP file signature
  }

  static createMockImageFile() {
    // Mock PNG file content
    return Buffer.from('\x89PNG\r\n\x1a\n');
  }
}

// Export all utilities
export {
  testUtils,
  APITestHelper,
  DatabaseTestHelper,
  MockDataFactory,
  AssertionHelpers,
  PerformanceTestHelper,
  FileUploadTestHelper
};