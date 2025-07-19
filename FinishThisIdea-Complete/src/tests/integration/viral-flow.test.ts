/**
 * VIRAL FLOW INTEGRATION TESTS
 * 
 * Tests the complete viral growth flow:
 * 1. User signs up and gets tokens
 * 2. User creates agents and showcases
 * 3. Referral system works
 * 4. Treasury distributes dividends
 * 5. User earns and spends tokens
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../server';
import { prisma } from '../../utils/database';
import { treasuryService } from '../../services/viral/treasury.service';
import { agentService } from '../../services/viral/agent.service';
import { showcaseService } from '../../services/viral/showcase.service';

describe('Viral Flow Integration Tests', () => {
  let testUser1: any;
  let testUser2: any;
  let agentTemplate: any;
  let userAgent: any;
  let showcase: any;

  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData();
    
    // Create test users
    testUser1 = await prisma.user.create({
      data: {
        id: 'test-user-1',
        email: 'test1@example.com',
        displayName: 'Test User 1',
        name: 'Test User 1'
      }
    });

    testUser2 = await prisma.user.create({
      data: {
        id: 'test-user-2',
        email: 'test2@example.com',
        displayName: 'Test User 2',
        name: 'Test User 2',
        referredBy: 'test-user-1' // User 2 referred by User 1
      }
    });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('User Registration and Token Award', () => {
    test('should award welcome tokens to new user', async () => {
      const tokensAwarded = await treasuryService.awardAchievementTokens(
        testUser1.id,
        'first_signup',
        100
      );

      expect(tokensAwarded).toBeTruthy();

      // Check user's token balance
      const user = await prisma.user.findUnique({
        where: { id: testUser1.id }
      });

      expect(user?.platformTokens).toBeGreaterThanOrEqual(100);
    });

    test('should award referral bonus when referred user signs up', async () => {
      // Award tokens to referred user
      await treasuryService.awardAchievementTokens(
        testUser2.id,
        'first_signup',
        100
      );

      // Award referral bonus to referrer
      await treasuryService.awardReferralBonus(testUser1.id, testUser2.id);

      // Check referrer's bonus
      const referrer = await prisma.user.findUnique({
        where: { id: testUser1.id }
      });

      expect(referrer?.referralEarnings).toBeGreaterThan(0);
    });
  });

  describe('Agent Creation and Management', () => {
    test('should create agent template', async () => {
      agentTemplate = await agentService.createAgentTemplate({
        name: 'Test Code Cleaner',
        description: 'A test agent for cleaning code',
        category: 'code-cleanup',
        prompt: 'Clean up this code and make it more readable',
        isPublic: true,
        createdBy: testUser1.id,
        tags: ['javascript', 'cleanup'],
        config: {
          model: 'gpt-3.5-turbo',
          temperature: 0.3,
          maxTokens: 2000
        }
      });

      expect(agentTemplate).toBeDefined();
      expect(agentTemplate.name).toBe('Test Code Cleaner');
      expect(agentTemplate.createdBy).toBe(testUser1.id);
    });

    test('should create user agent instance', async () => {
      userAgent = await agentService.createUserAgent({
        userId: testUser2.id,
        templateId: agentTemplate.id,
        customName: 'My Custom Cleaner',
        customConfig: {
          temperature: 0.5
        }
      });

      expect(userAgent).toBeDefined();
      expect(userAgent.userId).toBe(testUser2.id);
      expect(userAgent.templateId).toBe(agentTemplate.id);
    });

    test('should track agent usage and award tokens', async () => {
      // Simulate agent usage
      await agentService.trackAgentUsage(userAgent.id, {
        inputTokens: 100,
        outputTokens: 200,
        cost: 0.05,
        success: true
      });

      // Award usage tokens
      await treasuryService.awardAchievementTokens(
        testUser2.id,
        'agent_usage',
        10
      );

      // Check if tokens were awarded
      const user = await prisma.user.findUnique({
        where: { id: testUser2.id }
      });

      expect(user?.platformTokens).toBeGreaterThan(100); // Initial + usage bonus
    });
  });

  describe('Project Showcase System', () => {
    test('should create project showcase', async () => {
      showcase = await showcaseService.createShowcase({
        title: 'My Awesome React App',
        description: 'A beautiful React application built with modern tools',
        userId: testUser1.id,
        githubUrl: 'https://github.com/user/awesome-app',
        liveUrl: 'https://awesome-app.vercel.app',
        technologies: ['React', 'TypeScript', 'Tailwind'],
        category: 'web-app',
        featured: false
      });

      expect(showcase).toBeDefined();
      expect(showcase.title).toBe('My Awesome React App');
      expect(showcase.userId).toBe(testUser1.id);
    });

    test('should vote on showcase and award tokens', async () => {
      // User 2 votes on User 1's showcase
      await showcaseService.voteOnShowcase(showcase.id, testUser2.id, 'upvote');

      // Award tokens for receiving votes
      await treasuryService.awardAchievementTokens(
        testUser1.id,
        'showcase_vote_received',
        5
      );

      // Award tokens for voting
      await treasuryService.awardAchievementTokens(
        testUser2.id,
        'showcase_vote_given',
        2
      );

      // Check showcase vote count
      const updatedShowcase = await prisma.projectShowcase.findUnique({
        where: { id: showcase.id }
      });

      expect(updatedShowcase?.votes).toBeGreaterThan(0);
    });
  });

  describe('Treasury and Revenue Distribution', () => {
    test('should add revenue to treasury', async () => {
      const revenue = await treasuryService.addRevenue(25.00, {
        source: 'subscription',
        userId: testUser1.id,
        metadata: {
          tier: 'team',
          sessionId: 'test-session-123'
        }
      });

      expect(revenue).toBeTruthy();

      // Check if revenue was recorded
      const revenueRecord = await prisma.platformRevenue.findFirst({
        where: {
          source: 'subscription',
          userId: testUser1.id
        },
        orderBy: { createdAt: 'desc' }
      });

      expect(revenueRecord).toBeDefined();
      expect(revenueRecord?.amount).toBe(25.00);
    });

    test('should distribute dividends to token holders', async () => {
      // Distribute dividends
      const distribution = await treasuryService.distributeDividends();

      expect(distribution).toBeDefined();
      expect(distribution.totalDistributed).toBeGreaterThan(0);
      expect(distribution.recipientCount).toBeGreaterThan(0);

      // Check if users received dividends
      const user1 = await prisma.user.findUnique({
        where: { id: testUser1.id }
      });

      const user2 = await prisma.user.findUnique({
        where: { id: testUser2.id }
      });

      expect(user1?.totalEarnings).toBeGreaterThanOrEqual(0);
      expect(user2?.totalEarnings).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Collaboration System', () => {
    test('should create collaboration between users', async () => {
      const collaboration = await prisma.collaboration.create({
        data: {
          initiatorId: testUser1.id,
          participantId: testUser2.id,
          type: 'agent_improvement',
          status: 'active',
          metadata: {
            agentId: agentTemplate.id,
            description: 'Improve the code cleanup agent'
          }
        }
      });

      expect(collaboration).toBeDefined();
      expect(collaboration.initiatorId).toBe(testUser1.id);
      expect(collaboration.participantId).toBe(testUser2.id);
    });

    test('should award collaboration tokens', async () => {
      // Award tokens for collaboration participation
      await treasuryService.awardAchievementTokens(
        testUser1.id,
        'collaboration_initiated',
        20
      );

      await treasuryService.awardAchievementTokens(
        testUser2.id,
        'collaboration_participated',
        15
      );

      // Check token balances
      const user1 = await prisma.user.findUnique({
        where: { id: testUser1.id }
      });

      const user2 = await prisma.user.findUnique({
        where: { id: testUser2.id }
      });

      expect(user1?.platformTokens).toBeGreaterThan(200); // Accumulated tokens
      expect(user2?.platformTokens).toBeGreaterThan(100); // Accumulated tokens
    });
  });

  describe('Token Economy Integration', () => {
    test('should validate token economy balance', async () => {
      // Get total tokens in circulation
      const totalTokens = await prisma.user.aggregate({
        _sum: {
          platformTokens: true
        }
      });

      // Get total revenue
      const totalRevenue = await prisma.platformRevenue.aggregate({
        _sum: {
          amount: true
        }
      });

      expect(totalTokens._sum.platformTokens).toBeGreaterThan(0);
      expect(totalRevenue._sum.amount).toBeGreaterThan(0);

      // Token economy should be balanced
      const tokenToUSDRatio = (totalRevenue._sum.amount || 0) / (totalTokens._sum.platformTokens || 1);
      expect(tokenToUSDRatio).toBeGreaterThan(0);
    });

    test('should handle token spending simulation', async () => {
      // Simulate user spending tokens on premium features
      const initialTokens = testUser1.platformTokens;
      const spendAmount = 50;

      await prisma.user.update({
        where: { id: testUser1.id },
        data: {
          platformTokens: {
            decrement: spendAmount
          }
        }
      });

      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser1.id }
      });

      expect(updatedUser?.platformTokens).toBe(initialTokens - spendAmount);
    });
  });

  describe('Viral Growth Metrics', () => {
    test('should calculate viral coefficient', async () => {
      // Calculate how many users each user has referred
      const referralData = await prisma.user.groupBy({
        by: ['referredBy'],
        _count: {
          id: true
        },
        where: {
          referredBy: {
            not: null
          }
        }
      });

      expect(referralData.length).toBeGreaterThanOrEqual(1);
      
      // Find User 1's referrals
      const user1Referrals = referralData.find(r => r.referredBy === testUser1.id);
      expect(user1Referrals?._count.id).toBeGreaterThanOrEqual(1);
    });

    test('should validate engagement metrics', async () => {
      // Check agent usage
      const agentUsage = await prisma.userAgent.count({
        where: {
          userId: {
            in: [testUser1.id, testUser2.id]
          }
        }
      });

      // Check showcase engagement
      const showcaseCount = await prisma.projectShowcase.count({
        where: {
          userId: {
            in: [testUser1.id, testUser2.id]
          }
        }
      });

      expect(agentUsage).toBeGreaterThanOrEqual(1);
      expect(showcaseCount).toBeGreaterThanOrEqual(1);
    });
  });

  // Helper function to clean up test data
  async function cleanupTestData() {
    await prisma.collaboration.deleteMany({
      where: {
        OR: [
          { initiatorId: { in: ['test-user-1', 'test-user-2'] } },
          { participantId: { in: ['test-user-1', 'test-user-2'] } }
        ]
      }
    });

    await prisma.projectShowcase.deleteMany({
      where: {
        userId: { in: ['test-user-1', 'test-user-2'] }
      }
    });

    await prisma.userAgent.deleteMany({
      where: {
        userId: { in: ['test-user-1', 'test-user-2'] }
      }
    });

    await prisma.agentTemplate.deleteMany({
      where: {
        createdBy: { in: ['test-user-1', 'test-user-2'] }
      }
    });

    await prisma.platformRevenue.deleteMany({
      where: {
        userId: { in: ['test-user-1', 'test-user-2'] }
      }
    });

    await prisma.user.deleteMany({
      where: {
        id: { in: ['test-user-1', 'test-user-2'] }
      }
    });
  }
});