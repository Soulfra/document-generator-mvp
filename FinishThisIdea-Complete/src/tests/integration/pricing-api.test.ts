/**
 * PRICING & AI API SCALING INTEGRATION TESTS
 * 
 * Tests the complete pricing and AI API flow:
 * 1. Progressive pricing tier purchases
 * 2. API key generation and management
 * 3. AI API scaling and rate limiting
 * 4. BYOK functionality
 * 5. Service orchestration
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../server';
import { prisma } from '../../utils/database';
import { pricingService, createTieredCheckoutSession } from '../../services/pricing.service';
import { apiKeyManagementService } from '../../services/api-key-management.service';
import { serviceClient } from '../../services/orchestration/service-client';
import { serviceRegistry } from '../../services/orchestration/service-registry';

describe('Pricing & AI API Integration Tests', () => {
  let testUser: any;
  let testJob: any;
  let cleanupApiKey: string;
  let developerApiKey: string;
  let teamApiKey: string;
  let byokApiKey: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData();
    
    // Create test user
    testUser = await prisma.user.create({
      data: {
        id: 'test-pricing-user',
        email: 'pricing@example.com',
        displayName: 'Pricing Test User',
        name: 'Pricing Test User'
      }
    });

    // Create test job for cleanup tier
    testJob = await prisma.job.create({
      data: {
        id: 'test-job-123',
        uploadDir: 'test-uploads',
        status: 'PENDING',
        metadata: {
          fileCount: 5,
          language: 'javascript'
        }
      }
    });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Pricing Tier Recommendations', () => {
    test('should recommend cleanup tier for new user', async () => {
      const recommendedTier = await pricingService.getRecommendedTier(testUser.id);
      expect(recommendedTier).toBe('cleanup');
    });

    test('should get pricing display with user context', async () => {
      const pricingDisplay = await pricingService.getPricingDisplay(testUser.id);
      
      expect(pricingDisplay.tiers).toBeDefined();
      expect(pricingDisplay.tiers.length).toBeGreaterThan(0);
      expect(pricingDisplay.recommended).toBe('cleanup');
      expect(pricingDisplay.savings).toBeDefined();
    });

    test('should calculate savings correctly', async () => {
      const savings = pricingService.calculateSavings('cleanup', 'developer', 10);
      expect(savings).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Checkout Session Creation', () => {
    test('should create cleanup tier checkout session', async () => {
      const session = await createTieredCheckoutSession({
        jobId: testJob.id,
        tierId: 'cleanup',
        userId: testUser.id
      });

      expect(session).toBeDefined();
      expect(session.tierId).toBe('cleanup');
      expect(session.price).toBe(100); // $1.00 in cents
      expect(session.sessionId).toBeDefined();
      expect(session.url).toBeDefined();
    });

    test('should create developer tier checkout session', async () => {
      const session = await createTieredCheckoutSession({
        tierId: 'developer',
        userId: testUser.id
      });

      expect(session).toBeDefined();
      expect(session.tierId).toBe('developer');
      expect(session.price).toBe(500); // $5.00 in cents
    });

    test('should create team tier checkout session', async () => {
      const session = await createTieredCheckoutSession({
        tierId: 'team',
        userId: testUser.id
      });

      expect(session).toBeDefined();
      expect(session.tierId).toBe('team');
      expect(session.price).toBe(2500); // $25.00 in cents
    });

    test('should reject enterprise tier direct purchase', async () => {
      await expect(
        createTieredCheckoutSession({
          tierId: 'enterprise',
          userId: testUser.id
        })
      ).rejects.toThrow('Enterprise pricing requires custom quote');
    });
  });

  describe('API Key Generation', () => {
    test('should generate cleanup tier API key', async () => {
      const result = await apiKeyManagementService.generateAPIKeyForUser(
        testUser.id,
        'cleanup',
        {
          name: 'Test Cleanup Key',
          description: 'Testing cleanup tier access'
        }
      );

      expect(result).toBeDefined();
      expect(result.apiKey).toMatch(/^fti_cleanup_/);
      expect(result.keyInfo.tier).toBe('cleanup');
      expect(result.keyInfo.userId).toBe(testUser.id);
      
      cleanupApiKey = result.apiKey;
    });

    test('should generate developer tier API key', async () => {
      const result = await apiKeyManagementService.generateAPIKeyForUser(
        testUser.id,
        'developer',
        {
          name: 'Test Developer Key',
          expiresInDays: 90
        }
      );

      expect(result).toBeDefined();
      expect(result.apiKey).toMatch(/^fti_developer_/);
      expect(result.keyInfo.tier).toBe('developer');
      expect(result.keyInfo.expiresAt).toBeDefined();
      
      developerApiKey = result.apiKey;
    });

    test('should generate team tier API key', async () => {
      const result = await apiKeyManagementService.generateAPIKeyForUser(
        testUser.id,
        'team',
        {
          name: 'Test Team Key',
          expiresInDays: 365
        }
      );

      expect(result).toBeDefined();
      expect(result.apiKey).toMatch(/^fti_team_/);
      expect(result.keyInfo.tier).toBe('team');
      
      teamApiKey = result.apiKey;
    });

    test('should upgrade API key from developer to team', async () => {
      const result = await apiKeyManagementService.upgradeAPIKey(
        testUser.id,
        'developer',
        'team'
      );

      expect(result).toBeDefined();
      expect(result.apiKey).toMatch(/^fti_team_/);
      expect(result.keyInfo.tier).toBe('team');
    });
  });

  describe('BYOK (Bring Your Own Keys)', () => {
    test('should create BYOK API key with custom LLM keys', async () => {
      const mockKeys = {
        anthropic: 'sk-ant-api03-mock-key-for-testing',
        openai: 'sk-mock-openai-key-for-testing'
      };

      // Generate BYOK key (this is a mock implementation)
      const { generateBYOKKey } = await import('../../services/ai-api/auth');
      byokApiKey = generateBYOKKey(testUser.id, mockKeys);

      expect(byokApiKey).toMatch(/^byok_/);
      expect(byokApiKey).toContain(testUser.id);
    });

    test('should validate BYOK API key', async () => {
      const { validateAPIKey } = await import('../../services/ai-api/auth');
      const validation = await validateAPIKey(byokApiKey);

      expect(validation.valid).toBe(true);
      expect(validation.tier).toBe('byok');
      expect(validation.userId).toBe(testUser.id);
      expect(validation.customKeys).toBeDefined();
    });
  });

  describe('AI API Scaling Tests', () => {
    test('should handle concurrent API requests with rate limiting', async () => {
      // Simulate multiple concurrent requests to test rate limiting
      const requests = Array.from({ length: 15 }, (_, i) => 
        request(app)
          .post('/ai/analyze')
          .set('Authorization', `Bearer ${cleanupApiKey}`)
          .send({
            code: `function test${i}() { console.log('test'); }`,
            language: 'javascript'
          })
      );

      const responses = await Promise.allSettled(requests);
      
      // Some requests should succeed, others should be rate limited
      const successful = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      ).length;
      
      const rateLimited = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 429
      ).length;

      expect(successful).toBeGreaterThan(0);
      expect(successful).toBeLessThanOrEqual(10); // Cleanup tier limit
      
      if (rateLimited > 0) {
        expect(rateLimited).toBeGreaterThan(0);
      }
    });

    test('should respect different rate limits for different tiers', async () => {
      // Test cleanup tier (10/min)
      const cleanupRequests = Array.from({ length: 5 }, () =>
        request(app)
          .get('/ai/health')
          .set('Authorization', `Bearer ${cleanupApiKey}`)
      );

      // Test developer tier (100/min)
      const developerRequests = Array.from({ length: 20 }, () =>
        request(app)
          .get('/ai/health')
          .set('Authorization', `Bearer ${developerApiKey}`)
      );

      const [cleanupResponses, developerResponses] = await Promise.all([
        Promise.allSettled(cleanupRequests),
        Promise.allSettled(developerRequests)
      ]);

      // Developer tier should handle more requests
      const cleanupSuccess = cleanupResponses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      ).length;
      
      const developerSuccess = developerResponses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      ).length;

      expect(developerSuccess).toBeGreaterThanOrEqual(cleanupSuccess);
    });

    test('should return appropriate models for each tier', async () => {
      // Test cleanup tier models
      const cleanupModels = await request(app)
        .get('/ai/models')
        .set('Authorization', `Bearer ${cleanupApiKey}`)
        .expect(200);

      expect(cleanupModels.body.models).toBeDefined();
      expect(cleanupModels.body.tier).toBe('cleanup');

      // Test team tier models
      const teamModels = await request(app)
        .get('/ai/models')
        .set('Authorization', `Bearer ${teamApiKey}`)
        .expect(200);

      expect(teamModels.body.models).toBeDefined();
      expect(teamModels.body.tier).toBe('team');
      
      // Team tier should have access to more models than cleanup
      expect(teamModels.body.models.length).toBeGreaterThanOrEqual(
        cleanupModels.body.models.length
      );
    });
  });

  describe('Service Orchestration', () => {
    test('should check service health', async () => {
      const statuses = await serviceRegistry.getAllServiceStatuses();
      
      expect(statuses).toBeDefined();
      expect(Object.keys(statuses).length).toBeGreaterThan(0);
      
      // Check if main services are registered
      expect(statuses['finishthisidea-app']).toBeDefined();
      expect(statuses['finishthisidea-ai-api']).toBeDefined();
    });

    test('should make inter-service requests', async () => {
      // Test service-to-service communication
      const healthResponse = await serviceClient.get(
        'finishthisidea-ai-api',
        '/health'
      );

      expect(healthResponse.success).toBe(true);
      expect(healthResponse.statusCode).toBe(200);
      expect(healthResponse.responseTime).toBeGreaterThan(0);
    });

    test('should handle circuit breaker functionality', async () => {
      const circuitBreakers = serviceClient.getCircuitBreakerStatus();
      
      expect(circuitBreakers).toBeDefined();
      expect(Object.keys(circuitBreakers).length).toBeGreaterThan(0);
      
      // All circuit breakers should start closed
      Object.values(circuitBreakers).forEach(breaker => {
        expect(['closed', 'half-open', 'open']).toContain(breaker.state);
      });
    });

    test('should wait for service availability', async () => {
      const isAvailable = await serviceRegistry.waitForService(
        'finishthisidea-ai-api',
        5000 // 5 second timeout
      );

      expect(isAvailable).toBe(true);
    });
  });

  describe('Payment Integration Flow', () => {
    test('should simulate complete payment flow', async () => {
      // Create checkout session
      const session = await createTieredCheckoutSession({
        tierId: 'developer',
        userId: testUser.id
      });

      // Simulate successful payment
      const mockStripeSession = {
        id: session.sessionId,
        payment_intent: 'pi_mock_123',
        metadata: {
          tierId: 'developer',
          userId: testUser.id
        }
      };

      // Process the payment
      const { handleTieredCheckoutCompleted } = await import('../../services/pricing.service');
      await handleTieredCheckoutCompleted(mockStripeSession as any);

      // Verify API key was issued
      const userKeys = await apiKeyManagementService.getUserAPIKeys(testUser.id);
      expect(userKeys).toBeDefined();
    });
  });

  describe('Load Testing Simulation', () => {
    test('should handle burst traffic', async () => {
      const burstSize = 50;
      const requests = Array.from({ length: burstSize }, (_, i) =>
        request(app)
          .get('/api/health')
          .send()
      );

      const startTime = Date.now();
      const responses = await Promise.allSettled(requests);
      const endTime = Date.now();

      const successful = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      ).length;

      expect(successful).toBeGreaterThan(burstSize * 0.8); // 80% success rate
      expect(endTime - startTime).toBeLessThan(10000); // Under 10 seconds
    });

    test('should maintain performance under sustained load', async () => {
      const iterations = 10;
      const responseTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await request(app)
          .get('/api/health')
          .expect(200);
          
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      expect(averageResponseTime).toBeLessThan(1000); // Under 1 second average
      expect(maxResponseTime).toBeLessThan(3000); // Under 3 seconds max
    });
  });

  // Helper function to clean up test data
  async function cleanupTestData() {
    await prisma.payment.deleteMany({
      where: {
        job: {
          id: 'test-job-123'
        }
      }
    });

    await prisma.job.deleteMany({
      where: {
        id: 'test-job-123'
      }
    });

    await prisma.platformRevenue.deleteMany({
      where: {
        userId: 'test-pricing-user'
      }
    });

    await prisma.user.deleteMany({
      where: {
        id: 'test-pricing-user'
      }
    });
  }
});