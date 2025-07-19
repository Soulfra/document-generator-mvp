import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate, commonSchemas } from '../../middleware/validation.middleware';
import { rateLimiter } from '../../middleware/rate-limit.middleware';
import Joi from 'joi';
import { agentMarketplaceService } from '../../services/agent-marketplace/agent-marketplace.service';
import { voiceService } from '../../services/voice/voice.service';
import { logger } from '../../utils/logger';
import multer from 'multer';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Validation schemas
const createAgentSchema = {
  body: Joi.object({
    name: commonSchemas.shortText.required(),
    description: commonSchemas.mediumText.required(),
    category: Joi.string().valid('utility', 'creative', 'analysis', 'automation', 'communication', 'other').required(),
    price: Joi.number().min(0).max(1000).required(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).required(),
    inputTypes: Joi.array().items(Joi.string().valid('text', 'json', 'file', 'image')).required(),
    outputTypes: Joi.array().items(Joi.string().valid('text', 'json', 'file', 'image', 'stream')).required(),
    configSchema: Joi.object().optional(),
    systemPrompt: commonSchemas.longText.required(),
    exampleInputs: Joi.array().items(Joi.object()).optional(),
    exampleOutputs: Joi.array().items(Joi.object()).optional(),
    remixFromId: commonSchemas.uuid.optional()
  })
};

const browseAgentsSchema = {
  query: Joi.object({
    page: commonSchemas.positiveInteger.default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
    category: Joi.string().valid('utility', 'creative', 'analysis', 'automation', 'communication', 'other').optional(),
    search: Joi.string().max(100).optional(),
    sort: Joi.string().valid('newest', 'popular', 'trending', 'price-low', 'price-high', 'rating').default('popular'),
    priceMin: Joi.number().min(0).optional(),
    priceMax: Joi.number().max(1000).optional(),
    tags: Joi.array().items(Joi.string()).single().optional()
  })
};

const voiceToAgentSchema = {
  body: Joi.object({
    description: commonSchemas.mediumText.optional(),
    category: Joi.string().valid('utility', 'creative', 'analysis', 'automation', 'communication', 'other').optional(),
    remixFromId: commonSchemas.uuid.optional()
  })
};

const rateAgentSchema = {
  body: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    review: commonSchemas.mediumText.optional()
  })
};

const executeAgentSchema = {
  body: Joi.object({
    input: Joi.any().required(),
    config: Joi.object().optional()
  })
};

// Create new agent
router.post('/agents',
  authenticate(),
  validate(createAgentSchema),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const agent = await agentMarketplaceService.createAgent({
        ...req.body,
        creatorId: userId
      });

      res.status(201).json({
        success: true,
        data: agent
      });
    } catch (error) {
      logger.error('Error creating agent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create agent'
      });
    }
  }
);

// Browse agents
router.get('/agents',
  rateLimiter,
  validate(browseAgentsSchema),
  async (req, res) => {
    try {
      const result = await agentMarketplaceService.browseAgents({
        ...req.query,
        userId: req.user?.id
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error browsing agents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to browse agents'
      });
    }
  }
);

// Get agent details
router.get('/agents/:id',
  rateLimiter,
  validate({ params: Joi.object({ id: commonSchemas.uuid.required() }) }),
  async (req, res) => {
    try {
      const agent = await agentMarketplaceService.getAgentDetails(
        req.params.id,
        req.user?.id
      );

      if (!agent) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found'
        });
      }

      res.json({
        success: true,
        data: agent
      });
    } catch (error) {
      logger.error('Error getting agent details:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get agent details'
      });
    }
  }
);

// Purchase agent
router.post('/agents/:id/purchase',
  authenticate(),
  validate({ params: Joi.object({ id: commonSchemas.uuid.required() }) }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const purchase = await agentMarketplaceService.purchaseAgent(
        req.params.id,
        userId
      );

      res.json({
        success: true,
        data: purchase
      });
    } catch (error) {
      logger.error('Error purchasing agent:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to purchase agent'
      });
    }
  }
);

// Voice to agent
router.post('/voice-upload',
  authenticate(),
  upload.single('audio'),
  validate(voiceToAgentSchema),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No audio file provided'
        });
      }

      const userId = req.user!.id;
      const result = await voiceService.createAgentFromVoice({
        audioBuffer: req.file.buffer,
        mimeType: req.file.mimetype,
        userId,
        ...req.body
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error creating agent from voice:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create agent from voice'
      });
    }
  }
);

// Get user's purchases
router.get('/purchases',
  authenticate(),
  validate({
    query: Joi.object({
      page: commonSchemas.positiveInteger.default(1),
      limit: Joi.number().integer().min(1).max(50).default(20)
    })
  }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const result = await agentMarketplaceService.getUserPurchases(
        userId,
        req.query as any
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error getting user purchases:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get purchases'
      });
    }
  }
);

// Get user's created agents
router.get('/my-agents',
  authenticate(),
  validate({
    query: Joi.object({
      page: commonSchemas.positiveInteger.default(1),
      limit: Joi.number().integer().min(1).max(50).default(20)
    })
  }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const result = await agentMarketplaceService.getUserAgents(
        userId,
        req.query as any
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error getting user agents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get agents'
      });
    }
  }
);

// Rate agent
router.post('/agents/:id/rate',
  authenticate(),
  validate({ 
    params: Joi.object({ id: commonSchemas.uuid.required() }),
    ...rateAgentSchema
  }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const rating = await agentMarketplaceService.rateAgent(
        req.params.id,
        userId,
        req.body
      );

      res.json({
        success: true,
        data: rating
      });
    } catch (error) {
      logger.error('Error rating agent:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to rate agent'
      });
    }
  }
);

// Remix agent
router.post('/agents/:id/remix',
  authenticate(),
  validate({ 
    params: Joi.object({ id: commonSchemas.uuid.required() }),
    body: Joi.object({
      modifications: Joi.object({
        name: commonSchemas.shortText.optional(),
        description: commonSchemas.mediumText.optional(),
        systemPrompt: commonSchemas.longText.optional(),
        category: Joi.string().valid('utility', 'creative', 'analysis', 'automation', 'communication', 'other').optional(),
        price: Joi.number().min(0).max(1000).optional()
      }).required()
    })
  }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const remixedAgent = await agentMarketplaceService.remixAgent(
        req.params.id,
        userId,
        req.body.modifications
      );

      res.status(201).json({
        success: true,
        data: remixedAgent
      });
    } catch (error) {
      logger.error('Error remixing agent:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remix agent'
      });
    }
  }
);

// Execute agent
router.post('/agents/:id/execute',
  authenticate(),
  validate({ 
    params: Joi.object({ id: commonSchemas.uuid.required() }),
    ...executeAgentSchema
  }),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const result = await agentMarketplaceService.executeAgent(
        req.params.id,
        userId,
        req.body.input,
        req.body.config
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error executing agent:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute agent'
      });
    }
  }
);

// Marketplace status
router.get('/status',
  rateLimiter,
  async (req, res) => {
    try {
      const status = await agentMarketplaceService.getMarketplaceStatus();
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error getting marketplace status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get marketplace status'
      });
    }
  }
);

export { router as agentMarketplaceRouter };