import { Router } from 'express';
import { agentEconomyService } from '../../services/agent-economy.service';
import { logger } from '../../utils/logger';
import { presenceLogger } from '../../monitoring/presence-logger';

const router = Router();

/**
 * GET /api/agents/templates
 * Get available agent templates for minting
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = agentEconomyService.getAgentTemplates();
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error('Failed to get agent templates', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get agent templates'
    });
  }
});

/**
 * POST /api/agents/mint
 * Mint a new AI agent for the user
 */
router.post('/mint', async (req, res) => {
  try {
    const { templateId, customName, userId = 'demo-user' } = req.body;
    
    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required'
      });
    }

    const agent = await agentEconomyService.mintAgent(userId, templateId, customName, {
      sessionId: req.sessionID,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });

    // Log agent minting event
    await presenceLogger.logUserPresence('agent_minted', {
      sessionId: req.sessionID,
      userId,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      metadata: {
        agentId: agent.id,
        templateId,
        customName: agent.customName
      }
    });

    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    logger.error('Failed to mint agent', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/agents/user/:userId
 * Get user's agents
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const agents = agentEconomyService.getUserAgents(userId);
    
    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    logger.error('Failed to get user agents', { error, userId: req.params.userId });
    res.status(500).json({
      success: false,
      error: 'Failed to get user agents'
    });
  }
});

/**
 * GET /api/agents/public
 * Get public agents available for collaboration
 */
router.get('/public', async (req, res) => {
  try {
    const agents = agentEconomyService.getPublicAgents();
    
    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    logger.error('Failed to get public agents', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get public agents'
    });
  }
});

/**
 * POST /api/agents/:agentId/public
 * Make agent public for collaboration
 */
router.post('/:agentId/public', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { userId = 'demo-user' } = req.body;

    await agentEconomyService.makeAgentPublic(agentId, userId);

    res.json({
      success: true,
      message: 'Agent made public successfully'
    });
  } catch (error) {
    logger.error('Failed to make agent public', { error, agentId: req.params.agentId });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agents/collaborate
 * Start agent collaboration on a project
 */
router.post('/collaborate', async (req, res) => {
  try {
    const { projectId, agents } = req.body;
    
    if (!projectId || !agents || agents.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and agents are required'
      });
    }

    const collaboration = await agentEconomyService.startCollaboration(projectId, agents);

    // Log collaboration start
    await presenceLogger.logUserPresence('collaboration_started', {
      sessionId: req.sessionID,
      userId: 'system',
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      metadata: {
        collaborationId: collaboration.id,
        projectId,
        agentCount: agents.length
      }
    });

    res.json({
      success: true,
      data: collaboration
    });
  } catch (error) {
    logger.error('Failed to start collaboration', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agents/collaborate/:collaborationId/complete
 * Complete agent collaboration
 */
router.post('/collaborate/:collaborationId/complete', async (req, res) => {
  try {
    const { collaborationId } = req.params;
    const { outcome = 'success', revenueGenerated = 0 } = req.body;

    await agentEconomyService.completeCollaboration(collaborationId, outcome, revenueGenerated);

    res.json({
      success: true,
      message: 'Collaboration completed successfully'
    });
  } catch (error) {
    logger.error('Failed to complete collaboration', { error, collaborationId: req.params.collaborationId });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/agents/marketplace/stats
 * Get agent marketplace statistics
 */
router.get('/marketplace/stats', async (req, res) => {
  try {
    const stats = await agentEconomyService.getMarketplaceStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get marketplace stats', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get marketplace statistics'
    });
  }
});

/**
 * GET /api/agents/collaborations
 * Get collaboration history
 */
router.get('/collaborations', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const collaborations = agentEconomyService.getCollaborationHistory().slice(0, limit);
    
    res.json({
      success: true,
      data: collaborations
    });
  } catch (error) {
    logger.error('Failed to get collaborations', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get collaboration history'
    });
  }
});

/**
 * GET /api/agents/user
 * Get current user's agents (uses session)
 */
router.get('/user', async (req, res) => {
  try {
    const userId = req.session?.userId || 'demo-user';
    const agents = agentEconomyService.getUserAgents(userId);
    
    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    logger.error('Failed to get current user agents', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get user agents'
    });
  }
});

export default router;