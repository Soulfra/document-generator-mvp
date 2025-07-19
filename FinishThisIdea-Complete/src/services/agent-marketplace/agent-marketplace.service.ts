import { prisma } from '../../utils/database';
import { redis } from '../../config/redis';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/errors';
import { vibeService } from '../vibe/vibe.service';
import { aiConductorService } from '../ai-conductor/ai-conductor.service';
import { analyticsService } from '../analytics/analytics.service';
import { v4 as uuidv4 } from 'uuid';

interface CreateAgentInput {
  name: string;
  description: string;
  category: string;
  price: number;
  tags: string[];
  inputTypes: string[];
  outputTypes: string[];
  configSchema?: any;
  systemPrompt: string;
  exampleInputs?: any[];
  exampleOutputs?: any[];
  remixFromId?: string;
  creatorId: string;
}

interface BrowseAgentsQuery {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: string;
  priceMin?: number;
  priceMax?: number;
  tags?: string[];
  userId?: string;
}

interface AgentRating {
  rating: number;
  review?: string;
}

class AgentMarketplaceService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly TRENDING_WINDOW = 7 * 24 * 60 * 60 * 1000; // 7 days

  async createAgent(input: CreateAgentInput) {
    try {
      // Validate user has enough vibes to create
      const vibeBalance = await vibeService.getBalance(input.creatorId);
      const creationCost = 10; // 10 vibes to create an agent
      
      if (vibeBalance.balance < creationCost) {
        throw new AppError('Insufficient vibes to create agent', 400);
      }

      // Create the agent
      const agent = await prisma.agent.create({
        data: {
          id: uuidv4(),
          name: input.name,
          description: input.description,
          category: input.category,
          price: input.price,
          tags: input.tags,
          inputTypes: input.inputTypes,
          outputTypes: input.outputTypes,
          configSchema: input.configSchema || {},
          systemPrompt: input.systemPrompt,
          exampleInputs: input.exampleInputs || [],
          exampleOutputs: input.exampleOutputs || [],
          remixFromId: input.remixFromId,
          creatorId: input.creatorId,
          status: 'active',
          metadata: {
            version: '1.0.0',
            createdAt: new Date().toISOString()
          }
        }
      });

      // Deduct vibes
      await vibeService.deductVibes(input.creatorId, creationCost, 'agent_creation', {
        agentId: agent.id,
        agentName: agent.name
      });

      // Track analytics
      await analyticsService.trackAgentCreated(input.creatorId, {
        agentId: agent.id,
        category: agent.category,
        price: agent.price,
        remixed: !!input.remixFromId
      });

      // Clear cache
      await this.clearAgentCache();

      return agent;
    } catch (error) {
      logger.error('Error creating agent:', error);
      throw error;
    }
  }

  async browseAgents(query: BrowseAgentsQuery) {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        status: 'active'
      };

      if (query.category) {
        where.category = query.category;
      }

      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { tags: { hasSome: [query.search.toLowerCase()] } }
        ];
      }

      if (query.priceMin !== undefined || query.priceMax !== undefined) {
        where.price = {};
        if (query.priceMin !== undefined) where.price.gte = query.priceMin;
        if (query.priceMax !== undefined) where.price.lte = query.priceMax;
      }

      if (query.tags && query.tags.length > 0) {
        where.tags = { hasSome: query.tags };
      }

      // Build orderBy
      let orderBy: any = {};
      switch (query.sort) {
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'price-low':
          orderBy = { price: 'asc' };
          break;
        case 'price-high':
          orderBy = { price: 'desc' };
          break;
        case 'rating':
          orderBy = { averageRating: 'desc' };
          break;
        case 'trending':
          // Will handle with custom logic
          orderBy = { downloadCount: 'desc' };
          break;
        case 'popular':
        default:
          orderBy = { downloadCount: 'desc' };
      }

      // Get agents with purchase info if user is logged in
      const [agents, total] = await Promise.all([
        prisma.agent.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            creator: {
              select: {
                id: true,
                displayName: true,
                trustTier: true
              }
            },
            _count: {
              select: {
                purchases: true,
                ratings: true
              }
            }
          }
        }),
        prisma.agent.count({ where })
      ]);

      // Get user's purchases if logged in
      let userPurchases: string[] = [];
      if (query.userId) {
        const purchases = await prisma.agentPurchase.findMany({
          where: {
            userId: query.userId,
            status: 'completed'
          },
          select: { agentId: true }
        });
        userPurchases = purchases.map(p => p.agentId);
      }

      // Format response
      const formattedAgents = agents.map(agent => ({
        ...agent,
        downloadCount: agent._count.purchases,
        ratingCount: agent._count.ratings,
        isPurchased: userPurchases.includes(agent.id),
        isOwned: agent.creatorId === query.userId
      }));

      return {
        agents: formattedAgents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error browsing agents:', error);
      throw error;
    }
  }

  async getAgentDetails(agentId: string, userId?: string) {
    try {
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              trustTier: true,
              metadata: true
            }
          },
          remixedFrom: {
            select: {
              id: true,
              name: true,
              creatorId: true
            }
          },
          remixes: {
            select: {
              id: true,
              name: true,
              creatorId: true
            }
          },
          ratings: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true
                }
              }
            }
          },
          _count: {
            select: {
              purchases: true,
              ratings: true,
              remixes: true,
              executions: true
            }
          }
        }
      });

      if (!agent || agent.status !== 'active') {
        return null;
      }

      // Check if user has purchased or owns
      let isPurchased = false;
      let isOwned = false;
      if (userId) {
        isOwned = agent.creatorId === userId;
        if (!isOwned) {
          const purchase = await prisma.agentPurchase.findFirst({
            where: {
              agentId,
              userId,
              status: 'completed'
            }
          });
          isPurchased = !!purchase;
        }
      }

      return {
        ...agent,
        downloadCount: agent._count.purchases,
        ratingCount: agent._count.ratings,
        remixCount: agent._count.remixes,
        executionCount: agent._count.executions,
        isPurchased,
        isOwned
      };
    } catch (error) {
      logger.error('Error getting agent details:', error);
      throw error;
    }
  }

  async purchaseAgent(agentId: string, userId: string) {
    try {
      // Get agent details
      const agent = await prisma.agent.findUnique({
        where: { id: agentId }
      });

      if (!agent || agent.status !== 'active') {
        throw new AppError('Agent not found or unavailable', 404);
      }

      if (agent.creatorId === userId) {
        throw new AppError('Cannot purchase your own agent', 400);
      }

      // Check if already purchased
      const existingPurchase = await prisma.agentPurchase.findFirst({
        where: {
          agentId,
          userId,
          status: 'completed'
        }
      });

      if (existingPurchase) {
        throw new AppError('Agent already purchased', 400);
      }

      // Check vibe balance
      const vibeBalance = await vibeService.getBalance(userId);
      if (vibeBalance.balance < agent.price) {
        throw new AppError('Insufficient vibes', 400);
      }

      // Create purchase
      const purchase = await prisma.agentPurchase.create({
        data: {
          id: uuidv4(),
          agentId,
          userId,
          price: agent.price,
          status: 'completed',
          metadata: {
            purchasedAt: new Date().toISOString()
          }
        }
      });

      // Transfer vibes
      await vibeService.transferVibes(
        userId,
        agent.creatorId,
        agent.price,
        'agent_purchase',
        {
          agentId,
          purchaseId: purchase.id
        }
      );

      // Update agent stats
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          downloadCount: { increment: 1 },
          totalRevenue: { increment: agent.price }
        }
      });

      // Track analytics
      await analyticsService.trackAgentPurchased(userId, {
        agentId,
        price: agent.price,
        sellerId: agent.creatorId
      });

      return purchase;
    } catch (error) {
      logger.error('Error purchasing agent:', error);
      throw error;
    }
  }

  async getUserPurchases(userId: string, query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [purchases, total] = await Promise.all([
      prisma.agentPurchase.findMany({
        where: {
          userId,
          status: 'completed'
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          agent: {
            include: {
              creator: {
                select: {
                  id: true,
                  displayName: true
                }
              }
            }
          }
        }
      }),
      prisma.agentPurchase.count({
        where: {
          userId,
          status: 'completed'
        }
      })
    ]);

    return {
      purchases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getUserAgents(userId: string, query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where: {
          creatorId: userId
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              purchases: true,
              ratings: true,
              remixes: true,
              executions: true
            }
          }
        }
      }),
      prisma.agent.count({
        where: {
          creatorId: userId
        }
      })
    ]);

    const formattedAgents = agents.map(agent => ({
      ...agent,
      downloadCount: agent._count.purchases,
      ratingCount: agent._count.ratings,
      remixCount: agent._count.remixes,
      executionCount: agent._count.executions
    }));

    return {
      agents: formattedAgents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async rateAgent(agentId: string, userId: string, rating: AgentRating) {
    try {
      // Check if user has purchased the agent
      const purchase = await prisma.agentPurchase.findFirst({
        where: {
          agentId,
          userId,
          status: 'completed'
        }
      });

      const agent = await prisma.agent.findUnique({
        where: { id: agentId }
      });

      if (!agent) {
        throw new AppError('Agent not found', 404);
      }

      // Allow rating if purchased or owned
      if (!purchase && agent.creatorId !== userId) {
        throw new AppError('Must purchase agent before rating', 403);
      }

      // Check if already rated
      const existingRating = await prisma.agentRating.findUnique({
        where: {
          agentId_userId: {
            agentId,
            userId
          }
        }
      });

      let ratingRecord;
      if (existingRating) {
        // Update existing rating
        ratingRecord = await prisma.agentRating.update({
          where: {
            agentId_userId: {
              agentId,
              userId
            }
          },
          data: {
            rating: rating.rating,
            review: rating.review,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new rating
        ratingRecord = await prisma.agentRating.create({
          data: {
            agentId,
            userId,
            rating: rating.rating,
            review: rating.review
          }
        });
      }

      // Update agent average rating
      const ratings = await prisma.agentRating.findMany({
        where: { agentId },
        select: { rating: true }
      });

      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

      await prisma.agent.update({
        where: { id: agentId },
        data: {
          averageRating: avgRating,
          ratingCount: ratings.length
        }
      });

      // Track analytics
      await analyticsService.trackAgentRated(userId, {
        agentId,
        rating: rating.rating,
        isUpdate: !!existingRating
      });

      return ratingRecord;
    } catch (error) {
      logger.error('Error rating agent:', error);
      throw error;
    }
  }

  async remixAgent(agentId: string, userId: string, modifications: any) {
    try {
      // Get original agent
      const originalAgent = await prisma.agent.findUnique({
        where: { id: agentId }
      });

      if (!originalAgent || originalAgent.status !== 'active') {
        throw new AppError('Agent not found or unavailable', 404);
      }

      // Check if user has access (purchased or owns)
      const hasAccess = originalAgent.creatorId === userId ||
        await prisma.agentPurchase.findFirst({
          where: {
            agentId,
            userId,
            status: 'completed'
          }
        });

      if (!hasAccess) {
        throw new AppError('Must purchase agent before remixing', 403);
      }

      // Create remixed agent
      const remixedAgent = await this.createAgent({
        ...originalAgent,
        ...modifications,
        name: modifications.name || `${originalAgent.name} (Remix)`,
        remixFromId: agentId,
        creatorId: userId
      });

      // Track analytics
      await analyticsService.trackAgentRemixed(userId, {
        originalAgentId: agentId,
        remixedAgentId: remixedAgent.id
      });

      return remixedAgent;
    } catch (error) {
      logger.error('Error remixing agent:', error);
      throw error;
    }
  }

  async executeAgent(agentId: string, userId: string, input: any, config?: any) {
    try {
      // Get agent
      const agent = await prisma.agent.findUnique({
        where: { id: agentId }
      });

      if (!agent || agent.status !== 'active') {
        throw new AppError('Agent not found or unavailable', 404);
      }

      // Check if user has access
      const hasAccess = agent.creatorId === userId ||
        await prisma.agentPurchase.findFirst({
          where: {
            agentId,
            userId,
            status: 'completed'
          }
        });

      if (!hasAccess) {
        throw new AppError('Must purchase agent before executing', 403);
      }

      // Create execution record
      const execution = await prisma.agentExecution.create({
        data: {
          id: uuidv4(),
          agentId,
          userId,
          input: input,
          config: config || {},
          status: 'pending'
        }
      });

      try {
        // Execute agent using AI conductor
        const result = await aiConductorService.executeAgent({
          agentId,
          systemPrompt: agent.systemPrompt,
          input,
          config: { ...agent.configSchema, ...config }
        });

        // Update execution record
        await prisma.agentExecution.update({
          where: { id: execution.id },
          data: {
            status: 'completed',
            output: result,
            completedAt: new Date()
          }
        });

        // Update agent stats
        await prisma.agent.update({
          where: { id: agentId },
          data: {
            executionCount: { increment: 1 },
            lastExecutedAt: new Date()
          }
        });

        // Track analytics
        await analyticsService.trackAgentExecuted(userId, {
          agentId,
          executionId: execution.id
        });

        return {
          executionId: execution.id,
          output: result,
          metadata: {
            executedAt: new Date().toISOString(),
            executionTime: Date.now() - execution.createdAt.getTime()
          }
        };
      } catch (error) {
        // Update execution record with error
        await prisma.agentExecution.update({
          where: { id: execution.id },
          data: {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date()
          }
        });
        throw error;
      }
    } catch (error) {
      logger.error('Error executing agent:', error);
      throw error;
    }
  }

  async getMarketplaceStatus() {
    try {
      const cacheKey = 'marketplace:status';
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const [
        totalAgents,
        totalPurchases,
        totalUsers,
        categories,
        topAgents
      ] = await Promise.all([
        prisma.agent.count({ where: { status: 'active' } }),
        prisma.agentPurchase.count({ where: { status: 'completed' } }),
        prisma.user.count(),
        this.getCategoryStats(),
        this.getTopAgents()
      ]);

      const status = {
        stats: {
          totalAgents,
          totalPurchases,
          totalUsers,
          totalRevenue: await this.getTotalRevenue()
        },
        categories,
        topAgents,
        timestamp: new Date().toISOString()
      };

      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(status));
      return status;
    } catch (error) {
      logger.error('Error getting marketplace status:', error);
      throw error;
    }
  }

  private async getCategoryStats() {
    const categories = await prisma.agent.groupBy({
      by: ['category'],
      where: { status: 'active' },
      _count: {
        id: true
      }
    });

    return categories.map(cat => ({
      category: cat.category,
      count: cat._count.id
    }));
  }

  private async getTopAgents() {
    return prisma.agent.findMany({
      where: { status: 'active' },
      orderBy: { downloadCount: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        downloadCount: true,
        averageRating: true,
        creator: {
          select: {
            displayName: true
          }
        }
      }
    });
  }

  private async getTotalRevenue() {
    const result = await prisma.agentPurchase.aggregate({
      where: { status: 'completed' },
      _sum: {
        price: true
      }
    });
    return result._sum.price || 0;
  }

  private async clearAgentCache() {
    const keys = await redis.keys('marketplace:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

export const agentMarketplaceService = new AgentMarketplaceService();