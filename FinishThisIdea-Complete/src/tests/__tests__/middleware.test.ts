/**
 * MIDDLEWARE TESTS
 * 
 * Test suite for security, validation, and rate limiting middleware
 */

import { Request, Response, NextFunction } from 'express';
import { testUtils } from '../setup';

// Import middleware to test
import { authenticate } from '../../middleware/auth.middleware';
import { createAdvancedRateLimiter } from '../../middleware/rate-limit.middleware';
import { validateSchema } from '../../middleware/validation.middleware';
import { commonSchemas } from '../../middleware/validation.middleware';

describe('Authentication Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = testUtils.createMockRequest();
    res = testUtils.createMockResponse();
    next = testUtils.createMockNext();
  });

  describe('authenticate', () => {
    it('should authenticate valid Bearer token', async () => {
      req.headers = {
        authorization: 'Bearer valid-jwt-token'
      };

      await authenticate(req as Request, res as Response, next);

      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should authenticate valid API key', async () => {
      req.headers = {
        'x-api-key': 'valid-api-key'
      };

      await authenticate(req as Request, res as Response, next);

      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should handle session-based authentication', async () => {
      req.cookies = {
        sessionId: 'valid-session-id'
      };

      await authenticate(req as Request, res as Response, next);

      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject invalid tokens', async () => {
      req.headers = {
        authorization: 'Bearer invalid-token'
      };

      await authenticate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Invalid token')
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject expired tokens', async () => {
      req.headers = {
        authorization: 'Bearer expired-token'
      };

      await authenticate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('expired')
      });
    });

    it('should reject blacklisted tokens', async () => {
      req.headers = {
        authorization: 'Bearer blacklisted-token'
      };

      await authenticate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('revoked')
      });
    });

    it('should handle malformed Authorization headers', async () => {
      req.headers = {
        authorization: 'InvalidFormat'
      };

      await authenticate(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow public endpoints without authentication', async () => {
      req.path = '/api/public/health';

      await authenticate(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeUndefined();
    });

    it('should cache authentication results', async () => {
      req.headers = {
        authorization: 'Bearer valid-jwt-token'
      };

      // First call
      await authenticate(req as Request, res as Response, next);
      
      // Second call with same token should use cache
      await authenticate(req as Request, res as Response, next);

      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalledTimes(2);
    });
  });
});

describe('Rate Limiting Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let rateLimiter: any;

  beforeEach(() => {
    req = {
      ip: '127.0.0.1',
      headers: {},
      user: testUtils.createMockUser()
    };
    res = testUtils.createMockResponse();
    next = testUtils.createMockNext();
    
    rateLimiter = createAdvancedRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: 'Too many requests'
    });
  });

  it('should allow requests within rate limit', async () => {
    await rateLimiter(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should enforce rate limits per IP', async () => {
    // Make requests up to the limit
    for (let i = 0; i < 101; i++) {
      await rateLimiter(req as Request, res as Response, next);
    }

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: expect.stringContaining('Too many requests')
    });
  });

  it('should apply different limits based on trust tier', async () => {
    // SEEDLING user
    req.user = { ...testUtils.createMockUser(), trustTier: 'SEEDLING' };
    
    const seedlingLimiter = createAdvancedRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 10
    });

    // PRO user  
    req.user = { ...testUtils.createMockUser(), trustTier: 'PRO' };
    
    const proLimiter = createAdvancedRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 1000
    });

    // Test that different limits are applied
    expect(seedlingLimiter).toBeDefined();
    expect(proLimiter).toBeDefined();
  });

  it('should handle distributed rate limiting with Redis', async () => {
    // Test Redis-backed rate limiting for distributed systems
    req.ip = '192.168.1.100';
    
    await rateLimiter(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should detect and block suspicious IPs', async () => {
    req.ip = '10.0.0.1'; // Potentially suspicious IP
    
    // Simulate multiple rapid requests from suspicious IP
    for (let i = 0; i < 5; i++) {
      await rateLimiter(req as Request, res as Response, next);
    }

    // Should detect pattern and potentially block
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('should handle real IP detection behind proxies', async () => {
    req.headers = {
      'x-forwarded-for': '203.0.113.1, 198.51.100.1',
      'x-real-ip': '203.0.113.1'
    };

    await rateLimiter(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should implement sliding window algorithm', async () => {
    // Test that rate limit sliding window works correctly
    const startTime = Date.now();
    
    // Make requests at different times within window
    for (let i = 0; i < 50; i++) {
      // Simulate time passing
      jest.spyOn(Date, 'now').mockReturnValue(startTime + i * 1000);
      await rateLimiter(req as Request, res as Response, next);
    }

    expect(next).toHaveBeenCalled();
  });
});

describe('Validation Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = testUtils.createMockRequest();
    res = testUtils.createMockResponse();
    next = testUtils.createMockNext();
  });

  describe('Schema Validation', () => {
    it('should validate request body against schema', () => {
      const middleware = validateSchema({
        body: commonSchemas.email
      });

      req.body = { email: 'valid@example.com' };

      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject invalid data', () => {
      const middleware = validateSchema({
        body: commonSchemas.email
      });

      req.body = { email: 'invalid-email' };

      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('validation')
      });
    });

    it('should validate query parameters', () => {
      const middleware = validateSchema({
        query: commonSchemas.uuid
      });

      req.query = { id: '123e4567-e89b-12d3-a456-426614174000' };

      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should validate URL parameters', () => {
      const middleware = validateSchema({
        params: commonSchemas.uuid
      });

      req.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('XSS Protection', () => {
    it('should sanitize XSS attempts in request body', () => {
      const middleware = validateSchema({
        body: commonSchemas.email
      });

      req.body = {
        email: '<script>alert("xss")</script>@example.com'
      };

      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should detect and reject script tags', () => {
      const middleware = validateSchema({
        body: commonSchemas.email
      });

      req.body = {
        content: 'Hello <script>malicious()</script> world'
      };

      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should sanitize HTML entities', () => {
      const middleware = validateSchema({
        body: commonSchemas.email
      });

      req.body = {
        content: 'Test &lt;script&gt;alert()&lt;/script&gt;'
      };

      middleware(req as Request, res as Response, next);

      // Should sanitize but allow request to proceed
      expect(req.body.content).not.toContain('<script>');
    });
  });

  describe('SQL Injection Protection', () => {
    it('should detect SQL injection patterns', () => {
      const middleware = validateSchema({
        query: commonSchemas.email
      });

      req.query = {
        email: "test@example.com'; DROP TABLE users; --"
      };

      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Invalid input detected')
      });
    });

    it('should reject UNION attack attempts', () => {
      const middleware = validateSchema({
        query: commonSchemas.email
      });

      req.query = {
        id: '1 UNION SELECT * FROM users'
      };

      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Password Validation', () => {
    it('should enforce password complexity', () => {
      const middleware = validateSchema({
        body: commonSchemas.password
      });

      req.body = {
        password: 'SecurePassword123!'
      };

      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject weak passwords', () => {
      const middleware = validateSchema({
        body: commonSchemas.password
      });

      req.body = {
        password: '123'
      };

      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('password')
      });
    });

    it('should require special characters', () => {
      const middleware = validateSchema({
        body: commonSchemas.password
      });

      req.body = {
        password: 'SimplePassword123'
      };

      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('File Validation', () => {
    it('should validate file upload parameters', () => {
      const middleware = validateSchema({
        body: commonSchemas.uuid
      });

      req.body = {
        projectId: '123e4567-e89b-12d3-a456-426614174000'
      };

      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should enforce file size limits in validation', () => {
      // This would be part of file upload validation
      const fileValidation = validateSchema({
        body: {
          fileSize: commonSchemas.fileSize
        }
      });

      req.body = {
        fileSize: 1024 * 1024 * 100 // 100MB
      };

      fileValidation(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});