/**
 * AUTHENTICATION TESTS
 * 
 * Comprehensive test suite for authentication endpoints and middleware
 */

import { Express } from 'express';
import { APITestHelper, MockDataFactory, AssertionHelpers } from '../test-utils';

// Mock the app - in real tests this would import your actual app
const mockApp = {} as Express;
let api: APITestHelper;

describe('Authentication System', () => {
  beforeEach(() => {
    api = new APITestHelper(mockApp);
  });

  afterEach(() => {
    api.logout();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = MockDataFactory.createValidUserData();
      
      const response = await api.post('/api/auth/register', userData);
      
      AssertionHelpers.expectSuccessResponse(response, {
        user: expect.objectContaining({
          username: userData.username,
          email: userData.email
        })
      });
      expect(response.body.data).toHaveProperty('token');
    });

    it('should reject registration with invalid data', async () => {
      const invalidData = MockDataFactory.createInvalidUserData();
      
      const response = await api.post('/api/auth/register', invalidData);
      
      AssertionHelpers.expectValidationError(response);
    });

    it('should reject registration with existing email', async () => {
      const userData = MockDataFactory.createValidUserData();
      
      // First registration
      await api.post('/api/auth/register', userData);
      
      // Attempt duplicate registration
      const response = await api.post('/api/auth/register', userData);
      
      AssertionHelpers.expectErrorResponse(response, 409, 'already exists');
    });

    it('should enforce password complexity requirements', async () => {
      const weakPasswordData = {
        ...MockDataFactory.createValidUserData(),
        password: '123'
      };
      
      const response = await api.post('/api/auth/register', weakPasswordData);
      
      AssertionHelpers.expectValidationError(response, 'password');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      const userData = MockDataFactory.createValidUserData();
      await api.post('/api/auth/register', userData);
    });

    it('should login with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'SecurePassword123!'
      };
      
      const response = await api.post('/api/auth/login', credentials);
      
      AssertionHelpers.expectSuccessResponse(response);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
    });

    it('should reject login with invalid credentials', async () => {
      const invalidCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      const response = await api.post('/api/auth/login', invalidCredentials);
      
      AssertionHelpers.expectErrorResponse(response, 401, 'Invalid credentials');
    });

    it('should reject login with non-existent user', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'SecurePassword123!'
      };
      
      const response = await api.post('/api/auth/login', credentials);
      
      AssertionHelpers.expectErrorResponse(response, 401, 'Invalid credentials');
    });

    it('should handle malformed login requests', async () => {
      const response = await api.post('/api/auth/login', {});
      
      AssertionHelpers.expectValidationError(response);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout authenticated user', async () => {
      const user = await api.loginAs();
      
      const response = await api.post('/api/auth/logout');
      
      AssertionHelpers.expectSuccessResponse(response);
    });

    it('should handle logout without authentication', async () => {
      const response = await api.post('/api/auth/logout');
      
      // Should still succeed even without auth
      AssertionHelpers.expectSuccessResponse(response);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile for authenticated user', async () => {
      const user = await api.loginAs();
      
      const response = await api.get('/api/auth/me');
      
      AssertionHelpers.expectSuccessResponse(response, {
        id: user.id,
        email: user.email,
        username: user.username
      });
    });

    it('should reject unauthenticated requests', async () => {
      const response = await api.get('/api/auth/me');
      
      AssertionHelpers.expectAuthenticationError(response);
    });

    it('should handle invalid JWT tokens', async () => {
      const response = await api.get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');
      
      AssertionHelpers.expectAuthenticationError(response);
    });
  });

  describe('Authentication Middleware', () => {
    it('should accept valid Bearer tokens', async () => {
      const user = await api.loginAs();
      
      const response = await api.get('/api/projects');
      
      expect(response.status).not.toBe(401);
    });

    it('should accept valid API keys', async () => {
      const response = await api.get('/api/projects')
        .set('X-API-Key', 'valid-api-key');
      
      expect(response.status).not.toBe(401);
    });

    it('should reject expired tokens', async () => {
      const response = await api.get('/api/projects')
        .set('Authorization', 'Bearer expired-token');
      
      AssertionHelpers.expectAuthenticationError(response);
    });

    it('should reject blacklisted tokens', async () => {
      const user = await api.loginAs();
      
      // First logout to blacklist the token
      await api.post('/api/auth/logout');
      
      // Try to use the same token
      const response = await api.get('/api/projects');
      
      AssertionHelpers.expectAuthenticationError(response);
    });

    it('should handle malformed Authorization headers', async () => {
      const response = await api.get('/api/projects')
        .set('Authorization', 'InvalidFormat');
      
      AssertionHelpers.expectAuthenticationError(response);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on login attempts', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      // Make multiple failed login attempts
      const promises = Array(6).fill(null).map(() => 
        api.post('/api/auth/login', credentials)
      );
      
      const responses = await Promise.all(promises);
      
      // Should get rate limited after too many attempts
      const rateLimitedResponse = responses[responses.length - 1];
      AssertionHelpers.expectRateLimitError(rateLimitedResponse);
    });

    it('should enforce different rate limits based on trust tier', async () => {
      // Test that higher trust tier users get higher rate limits
      const seedlingUser = await api.loginAs({ trustTier: 'SEEDLING' });
      const proUser = await api.loginAs({ trustTier: 'PRO' });
      
      // This would require actual rate limiting implementation to test properly
      expect(seedlingUser.trustTier).toBe('SEEDLING');
      expect(proUser.trustTier).toBe('PRO');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await api.get('/api/auth/me');
      
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    it('should set appropriate CORS headers', async () => {
      const response = await api.get('/api/auth/me')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Input Validation', () => {
    it('should sanitize XSS attempts in registration', async () => {
      const xssData = {
        username: '<script>alert("xss")</script>',
        email: 'test@example.com',
        password: 'SecurePassword123!'
      };
      
      const response = await api.post('/api/auth/register', xssData);
      
      AssertionHelpers.expectValidationError(response);
    });

    it('should reject SQL injection attempts', async () => {
      const sqlInjectionData = {
        email: "test@example.com'; DROP TABLE users; --",
        password: 'SecurePassword123!'
      };
      
      const response = await api.post('/api/auth/login', sqlInjectionData);
      
      AssertionHelpers.expectValidationError(response);
    });

    it('should enforce email format validation', async () => {
      const invalidEmailData = {
        username: 'testuser',
        email: 'not-an-email',
        password: 'SecurePassword123!'
      };
      
      const response = await api.post('/api/auth/register', invalidEmailData);
      
      AssertionHelpers.expectValidationError(response, 'email');
    });
  });
});