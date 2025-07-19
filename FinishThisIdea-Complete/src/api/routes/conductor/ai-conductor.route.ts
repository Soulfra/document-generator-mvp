import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../../../utils/logger';
import { aiConductorIntegration } from '../../../services/conductor/ai-conductor.integration';

const router = Router();

// Validation schemas
const ingestConversationSchema = z.object({
  content: z.string().min(1).max(10000),
  source: z.enum(['claude', 'gpt4', 'gemini', 'local']),
  threadId: z.string(),
  userId: z.string().optional(),
  metadata: z.any().optional()
});

const thoughtChainSchema = z.object({
  goal: z.string().min(1).max(1000),
  context: z.string().max(5000).optional().default(''),
  maxDepth: z.number().min(1).max(10).default(5),
  userId: z.string().optional()
});

const orchestrateProjectSchema = z.object({
  projectId: z.string().min(1)
});

/**
 * @route POST /api/conductor/start
 * @desc Start the AI Conductor system
 * @access Public
 */
router.post('/start', async (req, res) => {
  try {
    logger.info('Starting AI Conductor via API request');
    
    await aiConductorIntegration.startConductor();
    
    res.json({
      success: true,
      message: 'AI Conductor started successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to start AI Conductor', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'CONDUCTOR_START_FAILED',
        message: error.message
      }
    });
  }
});

/**
 * @route POST /api/conductor/stop
 * @desc Stop the AI Conductor system
 * @access Public
 */
router.post('/stop', async (req, res) => {
  try {
    logger.info('Stopping AI Conductor via API request');
    
    await aiConductorIntegration.stopConductor();
    
    res.json({
      success: true,
      message: 'AI Conductor stopped successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to stop AI Conductor', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'CONDUCTOR_STOP_FAILED',
        message: error.message
      }
    });
  }
});

/**
 * @route GET /api/conductor/status
 * @desc Get AI Conductor system status
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    const status = await aiConductorIntegration.getConductorStatus();
    
    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    logger.error('Failed to get conductor status', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'CONDUCTOR_STATUS_FAILED',
        message: 'Failed to get conductor status'
      }
    });
  }
});

/**
 * @route POST /api/conductor/ingest
 * @desc Ingest conversation into AI Conductor for semantic analysis
 * @access Public
 */
router.post('/ingest', async (req, res) => {
  try {
    const validatedData = ingestConversationSchema.parse(req.body);
    
    await aiConductorIntegration.ingestConversation(validatedData);
    
    logger.info('Conversation ingested successfully', { 
      threadId: validatedData.threadId,
      source: validatedData.source 
    });

    res.json({
      success: true,
      message: 'Conversation ingested successfully',
      data: {
        threadId: validatedData.threadId,
        source: validatedData.source,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors
        }
      });
    }

    logger.error('Failed to ingest conversation', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: {
        code: 'INGEST_FAILED',
        message: error.message
      }
    });
  }
});

/**
 * @route POST /api/conductor/thought-chain
 * @desc Generate Tree of Thought chain for complex reasoning
 * @access Public
 */
router.post('/thought-chain', async (req, res) => {
  try {
    const validatedData = thoughtChainSchema.parse(req.body);
    
    const thoughtChain = await aiConductorIntegration.generateThoughtChain(validatedData);
    
    logger.info('Thought chain generated successfully', { 
      goal: validatedData.goal,
      nodeCount: thoughtChain.length 
    });

    res.json({
      success: true,
      data: {
        goal: validatedData.goal,
        thoughtChain,
        metadata: {
          nodeCount: thoughtChain.length,
          maxDepth: validatedData.maxDepth,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors
        }
      });
    }

    logger.error('Failed to generate thought chain', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: {
        code: 'THOUGHT_CHAIN_FAILED',
        message: error.message
      }
    });
  }
});

/**
 * @route GET /api/conductor/builders
 * @desc Get available AI builders and their status
 * @access Public
 */
router.get('/builders', async (req, res) => {
  try {
    const builders = await aiConductorIntegration.getAIBuilders();
    
    res.json({
      success: true,
      data: {
        builders,
        summary: {
          total: builders.length,
          active: builders.filter(b => b.status === 'building').length,
          idle: builders.filter(b => b.status === 'idle').length,
          blocked: builders.filter(b => b.status === 'blocked').length,
          error: builders.filter(b => b.status === 'error').length
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get AI builders', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'BUILDERS_FAILED',
        message: error.message
      }
    });
  }
});

/**
 * @route POST /api/conductor/orchestrate
 * @desc Orchestrate project using AI Conductor
 * @access Public
 */
router.post('/orchestrate', async (req, res) => {
  try {
    const validatedData = orchestrateProjectSchema.parse(req.body);
    
    const result = await aiConductorIntegration.orchestrateProject(validatedData.projectId);
    
    logger.info('Project orchestrated successfully', { 
      projectId: validatedData.projectId,
      assignmentCount: Object.keys(result.assignments).length 
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors
        }
      });
    }

    logger.error('Failed to orchestrate project', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: {
        code: 'ORCHESTRATION_FAILED',
        message: error.message
      }
    });
  }
});

/**
 * @route GET /api/conductor/projects
 * @desc Get all project states from AI Conductor
 * @access Public
 */
router.get('/projects', async (req, res) => {
  try {
    const projects = await aiConductorIntegration.getProjectStates();
    
    res.json({
      success: true,
      data: {
        projects,
        summary: {
          total: projects.length,
          avgProgress: projects.reduce((sum, p) => sum + p.progress, 0) / projects.length || 0,
          withBlockers: projects.filter(p => p.blockers.length > 0).length,
          completed: projects.filter(p => p.progress >= 100).length
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get project states', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'PROJECTS_FAILED',
        message: error.message
      }
    });
  }
});

/**
 * @route POST /api/conductor/laboratory/integrate
 * @desc Integrate AI Laboratory sessions with Conductor for analysis
 * @access Public
 */
router.post('/laboratory/integrate', async (req, res) => {
  try {
    const { sessionId, question, responses, storyMode } = req.body;
    
    if (!sessionId || !question || !responses) {
      return res.status(400).json({
        success: false,
        error: 'sessionId, question, and responses are required'
      });
    }

    // Ingest the laboratory session as a conversation
    await aiConductorIntegration.ingestConversation({
      content: JSON.stringify({
        question,
        responses,
        storyMode,
        context: 'ai-laboratory'
      }),
      source: 'claude',
      threadId: `lab-${sessionId}`,
      metadata: {
        type: 'laboratory-session',
        profileCount: responses.length,
        storyMode,
        timestamp: new Date().toISOString()
      }
    });

    // Generate thought chain for optimization suggestions
    const thoughtChain = await aiConductorIntegration.generateThoughtChain({
      goal: `Optimize AI responses for: ${question}`,
      context: `Laboratory session with ${responses.length} different AI profiles. Story mode: ${storyMode}`,
      maxDepth: 3
    });

    logger.info('Laboratory session integrated with Conductor', { 
      sessionId,
      responseCount: responses.length,
      thoughtNodes: thoughtChain.length 
    });

    res.json({
      success: true,
      data: {
        sessionId,
        ingested: true,
        thoughtChain,
        optimizationSuggestions: thoughtChain.slice(0, 3).map(node => ({
          suggestion: node.thought,
          reasoning: node.reasoning,
          confidence: node.confidence
        }))
      }
    });

  } catch (error) {
    logger.error('Failed to integrate laboratory session', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTEGRATION_FAILED',
        message: error.message
      }
    });
  }
});

export { router as aiConductorRouter };