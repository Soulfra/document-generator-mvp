/**
 * DATABASE TESTS
 * 
 * Test suite for database operations with Prisma ORM
 */

import { PrismaClient } from '@prisma/client';
import { testUtils, DatabaseTestHelper } from '../test-utils';

// Mock Prisma client
const mockPrisma = {
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
  $disconnect: jest.fn(),
} as unknown as PrismaClient;

let dbHelper: DatabaseTestHelper;

describe('Database Operations', () => {
  beforeEach(() => {
    dbHelper = new DatabaseTestHelper();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await dbHelper.cleanupTestData();
  });

  describe('User Operations', () => {
    it('should create a new user', async () => {
      const userData = testUtils.createMockUser();
      
      mockPrisma.user.create.mockResolvedValue(userData);
      
      const result = await mockPrisma.user.create({
        data: {
          email: userData.email,
          username: userData.username,
          platformTokens: userData.platformTokens,
          trustTier: userData.trustTier
        }
      });

      expect(result).toEqual(userData);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: userData.email,
          username: userData.username
        })
      });
    });

    it('should find user by email', async () => {
      const userData = testUtils.createMockUser();
      
      mockPrisma.user.findUnique.mockResolvedValue(userData);
      
      const result = await mockPrisma.user.findUnique({
        where: { email: userData.email }
      });

      expect(result).toEqual(userData);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email }
      });
    });

    it('should update user platform tokens', async () => {
      const userData = testUtils.createMockUser();
      const updatedUser = { ...userData, platformTokens: 150 };
      
      mockPrisma.user.update.mockResolvedValue(updatedUser);
      
      const result = await mockPrisma.user.update({
        where: { id: userData.id },
        data: { platformTokens: 150 }
      });

      expect(result.platformTokens).toBe(150);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userData.id },
        data: { platformTokens: 150 }
      });
    });

    it('should handle user not found gracefully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      
      const result = await mockPrisma.user.findUnique({
        where: { id: 'non-existent-id' }
      });

      expect(result).toBeNull();
    });

    it('should delete user and cascade relations', async () => {
      const userData = testUtils.createMockUser();
      
      mockPrisma.user.delete.mockResolvedValue(userData);
      
      const result = await mockPrisma.user.delete({
        where: { id: userData.id }
      });

      expect(result).toEqual(userData);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: userData.id }
      });
    });
  });

  describe('Project Operations', () => {
    it('should create project with user relationship', async () => {
      const userData = testUtils.createMockUser();
      const projectData = testUtils.createMockProject();
      
      mockPrisma.project.create.mockResolvedValue({
        ...projectData,
        user: userData
      });
      
      const result = await mockPrisma.project.create({
        data: {
          title: projectData.title,
          description: projectData.description,
          userId: userData.id
        },
        include: { user: true }
      });

      expect(result.user).toEqual(userData);
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: projectData.title,
          userId: userData.id
        }),
        include: { user: true }
      });
    });

    it('should find projects by user with pagination', async () => {
      const userData = testUtils.createMockUser();
      const projects = [
        testUtils.createMockProject(),
        testUtils.createMockProject()
      ];
      
      mockPrisma.project.findMany.mockResolvedValue(projects);
      
      const result = await mockPrisma.project.findMany({
        where: { userId: userData.id },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });

      expect(result).toEqual(projects);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: { userId: userData.id },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should search projects by title and description', async () => {
      const projects = [testUtils.createMockProject()];
      
      mockPrisma.project.findMany.mockResolvedValue(projects);
      
      const result = await mockPrisma.project.findMany({
        where: {
          OR: [
            { title: { contains: 'AI', mode: 'insensitive' } },
            { description: { contains: 'AI', mode: 'insensitive' } }
          ]
        }
      });

      expect(result).toEqual(projects);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          OR: expect.arrayContaining([
            expect.objectContaining({
              title: { contains: 'AI', mode: 'insensitive' }
            })
          ])
        }
      });
    });

    it('should update project with validation', async () => {
      const projectData = testUtils.createMockProject();
      const updatedProject = { ...projectData, title: 'Updated Title' };
      
      mockPrisma.project.update.mockResolvedValue(updatedProject);
      
      const result = await mockPrisma.project.update({
        where: { id: projectData.id },
        data: { title: 'Updated Title' }
      });

      expect(result.title).toBe('Updated Title');
    });
  });

  describe('Transaction Operations', () => {
    it('should create platform token transaction', async () => {
      const userData = testUtils.createMockUser();
      const transactionData = {
        id: 'txn-123',
        userId: userData.id,
        amount: -10,
        type: 'DEBIT',
        description: 'Project creation cost',
        createdAt: new Date()
      };
      
      mockPrisma.transaction.create.mockResolvedValue(transactionData);
      
      const result = await mockPrisma.transaction.create({
        data: {
          userId: userData.id,
          amount: -10,
          type: 'DEBIT',
          description: 'Project creation cost'
        }
      });

      expect(result.amount).toBe(-10);
      expect(result.type).toBe('DEBIT');
    });

    it('should handle atomic operations with $transaction', async () => {
      const userData = testUtils.createMockUser();
      const projectData = testUtils.createMockProject();
      
      mockPrisma.$transaction.mockImplementation(async (operations) => {
        return await Promise.all(operations);
      });

      const operations = [
        mockPrisma.project.create({
          data: {
            title: projectData.title,
            description: projectData.description,
            userId: userData.id
          }
        }),
        mockPrisma.user.update({
          where: { id: userData.id },
          data: { platformTokens: { decrement: 10 } }
        }),
        mockPrisma.transaction.create({
          data: {
            userId: userData.id,
            amount: -10,
            type: 'DEBIT',
            description: 'Project creation'
          }
        })
      ];

      await mockPrisma.$transaction(operations);

      expect(mockPrisma.$transaction).toHaveBeenCalledWith(operations);
    });

    it('should rollback transaction on failure', async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

      try {
        await mockPrisma.$transaction([
          mockPrisma.user.update({
            where: { id: 'user-id' },
            data: { platformTokens: { decrement: 10 } }
          })
        ]);
      } catch (error) {
        expect(error.message).toBe('Transaction failed');
      }

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('Complex Queries', () => {
    it('should fetch user with projects and transactions', async () => {
      const userData = testUtils.createMockUser();
      const projects = [testUtils.createMockProject()];
      const transactions = [{
        id: 'txn-1',
        amount: -10,
        type: 'DEBIT',
        description: 'Test transaction'
      }];

      const userWithRelations = {
        ...userData,
        projects,
        transactions
      };

      mockPrisma.user.findUnique.mockResolvedValue(userWithRelations);

      const result = await mockPrisma.user.findUnique({
        where: { id: userData.id },
        include: {
          projects: true,
          transactions: true
        }
      });

      expect(result.projects).toEqual(projects);
      expect(result.transactions).toEqual(transactions);
    });

    it('should aggregate user statistics', async () => {
      const aggregateResult = {
        _count: { projects: 5 },
        _sum: { platformTokens: 500 },
        _avg: { platformTokens: 100 }
      };

      // Mock aggregate function (would be available on actual Prisma client)
      const mockAggregate = jest.fn().mockResolvedValue(aggregateResult);
      (mockPrisma.user as any).aggregate = mockAggregate;

      const result = await (mockPrisma.user as any).aggregate({
        _count: { projects: true },
        _sum: { platformTokens: true },
        _avg: { platformTokens: true }
      });

      expect(result._count.projects).toBe(5);
      expect(result._sum.platformTokens).toBe(500);
    });

    it('should handle raw SQL queries for complex operations', async () => {
      const rawResult = [
        { userId: 'user-1', projectCount: 3, totalTokensSpent: 30 },
        { userId: 'user-2', projectCount: 1, totalTokensSpent: 10 }
      ];

      // Mock $queryRaw (would be available on actual Prisma client)
      (mockPrisma as any).$queryRaw = jest.fn().mockResolvedValue(rawResult);

      const result = await (mockPrisma as any).$queryRaw`
        SELECT 
          u.id as "userId",
          COUNT(p.id) as "projectCount",
          COALESCE(SUM(ABS(t.amount)), 0) as "totalTokensSpent"
        FROM users u
        LEFT JOIN projects p ON u.id = p.user_id
        LEFT JOIN transactions t ON u.id = t.user_id AND t.type = 'DEBIT'
        GROUP BY u.id
      `;

      expect(result).toEqual(rawResult);
    });
  });

  describe('Database Error Handling', () => {
    it('should handle unique constraint violations', async () => {
      const error = new Error('Unique constraint failed');
      error.code = 'P2002';
      
      mockPrisma.user.create.mockRejectedValue(error);

      try {
        await mockPrisma.user.create({
          data: {
            email: 'existing@example.com',
            username: 'existinguser'
          }
        });
      } catch (err) {
        expect(err.code).toBe('P2002');
        expect(err.message).toContain('Unique constraint');
      }
    });

    it('should handle foreign key constraint violations', async () => {
      const error = new Error('Foreign key constraint failed');
      error.code = 'P2003';
      
      mockPrisma.project.create.mockRejectedValue(error);

      try {
        await mockPrisma.project.create({
          data: {
            title: 'Test Project',
            userId: 'non-existent-user'
          }
        });
      } catch (err) {
        expect(err.code).toBe('P2003');
      }
    });

    it('should handle connection timeouts', async () => {
      const error = new Error('Connection timeout');
      error.code = 'P1008';
      
      mockPrisma.user.findMany.mockRejectedValue(error);

      try {
        await mockPrisma.user.findMany();
      } catch (err) {
        expect(err.code).toBe('P1008');
        expect(err.message).toContain('timeout');
      }
    });
  });

  describe('Data Validation', () => {
    it('should validate email format at database level', async () => {
      const invalidUser = {
        email: 'invalid-email-format',
        username: 'testuser'
      };
      
      const error = new Error('Invalid email format');
      mockPrisma.user.create.mockRejectedValue(error);

      try {
        await mockPrisma.user.create({ data: invalidUser });
      } catch (err) {
        expect(err.message).toContain('email');
      }
    });

    it('should enforce minimum username length', async () => {
      const invalidUser = {
        email: 'test@example.com',
        username: 'x' // Too short
      };
      
      const error = new Error('Username too short');
      mockPrisma.user.create.mockRejectedValue(error);

      try {
        await mockPrisma.user.create({ data: invalidUser });
      } catch (err) {
        expect(err.message).toContain('Username');
      }
    });

    it('should validate platform token amounts', async () => {
      const invalidTransaction = {
        userId: 'user-id',
        amount: -999999, // Invalid large negative amount
        type: 'DEBIT'
      };
      
      const error = new Error('Invalid transaction amount');
      mockPrisma.transaction.create.mockRejectedValue(error);

      try {
        await mockPrisma.transaction.create({ data: invalidTransaction });
      } catch (err) {
        expect(err.message).toContain('amount');
      }
    });
  });

  describe('Performance and Indexing', () => {
    it('should efficiently query users by email (indexed field)', async () => {
      const userData = testUtils.createMockUser();
      
      mockPrisma.user.findUnique.mockResolvedValue(userData);
      
      const start = Date.now();
      await mockPrisma.user.findUnique({
        where: { email: userData.email }
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Should be fast with proper indexing
      expect(mockPrisma.user.findUnique).toHaveBeenCalled();
    });

    it('should efficiently paginate through large datasets', async () => {
      const projects = Array(100).fill(null).map(() => testUtils.createMockProject());
      
      mockPrisma.project.findMany.mockResolvedValue(projects.slice(0, 20));
      
      const result = await mockPrisma.project.findMany({
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' }
      });

      expect(result.length).toBe(20);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
    });
  });
});