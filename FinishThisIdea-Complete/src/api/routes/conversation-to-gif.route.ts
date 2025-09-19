/**
 * 🎬 Conversation to GIF API Routes
 * 
 * Integrates the conversation-to-visual pipeline with the main FinishThisIdea platform.
 * Provides REST endpoints that proxy to the conversation analysis and GIF generation services.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import WebSocket from 'ws';
import axios from 'axios';

const router = Router();

// Validation schemas
const ConversationMessage = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
  timestamp: z.number().optional()
});

const ExtractVisualsRequest = z.object({
  conversation: z.array(ConversationMessage).min(1),
  extractionOptions: z.object({
    includeEmotions: z.boolean().default(true),
    includeActions: z.boolean().default(true),
    includeObjects: z.boolean().default(true),
    includeSettings: z.boolean().default(true),
    maxSprites: z.number().min(1).max(10).default(5)
  }).optional()
});

const GenerateGIFsRequest = z.object({
  conversation: z.array(ConversationMessage).min(1),
  animationSettings: z.object({
    frameRate: z.number().min(1).max(30).default(8),
    duration: z.number().min(500).max(5000).default(2000),
    animationType: z.enum(['bounce', 'rotation', 'pulse', 'sequence', 'loop']).default('loop'),
    spriteSize: z.string().default('32x32')
  }).optional(),
  outputOptions: z.object({
    format: z.enum(['gif', 'webp', 'mp4']).default('gif'),
    quality: z.enum(['low', 'medium', 'high']).default('medium'),
    includeMetadata: z.boolean().default(true)
  }).optional()
});

// Service endpoints
const SERVICES = {
  visualExtractor: 'http://localhost:8091',
  gifGenerator: 'http://localhost:8093',
  soulFraIntegration: 'http://localhost:8092',
  aiOrchestrator: 'http://localhost:3001'
};

/**
 * Extract visual elements from conversation
 * POST /api/conversation-to-gif/extract-visuals
 */
router.post('/extract-visuals', async (req: Request, res: Response) => {
  try {
    // Validate request
    const validatedData = ExtractVisualsRequest.parse(req.body);
    
    // Forward to visual extractor service
    const response = await axios.post(`${SERVICES.visualExtractor}/extract-visuals`, {
      conversation: validatedData.conversation,
      options: validatedData.extractionOptions
    }, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': req.headers['x-user-id'] || 'anonymous',
        'X-Request-Source': 'platform-hub'
      }
    });
    
    // Return processed result
    res.json({
      success: true,
      extractionId: response.data.extractionId || `ext-${Date.now()}`,
      visualElements: response.data.visualElements,
      spriteDescriptions: response.data.spriteDescriptions,
      processingTime: response.data.processingTime,
      metadata: {
        source: 'conversation-to-gif-platform',
        timestamp: new Date().toISOString(),
        messageCount: validatedData.conversation.length
      }
    });
    
  } catch (error) {
    console.error('Extract visuals error:', error);
    
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        success: false,
        error: 'Visual extraction service error',
        details: error.response?.data?.error || error.message,
        serviceStatus: 'unavailable'
      });
    }
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request format',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate GIFs from conversation (complete pipeline)
 * POST /api/conversation-to-gif/generate-gifs
 */
router.post('/generate-gifs', async (req: Request, res: Response) => {
  try {
    // Validate request
    const validatedData = GenerateGIFsRequest.parse(req.body);
    
    const startTime = Date.now();
    
    // Step 1: Extract visual elements
    const extractionResponse = await axios.post(`${SERVICES.visualExtractor}/extract-visuals`, {
      conversation: validatedData.conversation,
      options: {
        maxSprites: 5,
        includeEmotions: true,
        includeActions: true,
        includeObjects: true,
        includeSettings: true
      }
    }, { timeout: 30000 });
    
    const extraction = extractionResponse.data;
    
    if (!extraction.spriteDescriptions || extraction.spriteDescriptions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No visual elements found in conversation',
        extraction: extraction
      });
    }
    
    // Step 2: Generate GIFs for each sprite
    const animationSettings = validatedData.animationSettings || {};
    const gifPromises = extraction.spriteDescriptions.map(async (sprite: any) => {
      try {
        const gifResponse = await axios.post(`${SERVICES.gifGenerator}/generate`, {
          spriteData: {
            ...sprite,
            size: animationSettings.spriteSize || '32x32'
          },
          animationData: {
            type: animationSettings.animationType || 'loop',
            frames: Math.ceil((animationSettings.duration || 2000) / (animationSettings.frameRate || 8)),
            duration: animationSettings.duration || 2000,
            frameDelay: Math.floor(1000 / (animationSettings.frameRate || 8))
          },
          options: {
            conversation: validatedData.conversation,
            quality: validatedData.outputOptions?.quality || 'medium'
          }
        }, { timeout: 60000 }); // 60 second timeout for GIF generation
        
        return {
          ...gifResponse.data.data,
          spriteId: `sprite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          downloadUrl: `/api/conversation-to-gif/download/${gifResponse.data.data.generationId}`
        };
        
      } catch (error) {
        console.error(`GIF generation failed for sprite ${sprite.name}:`, error);
        return {
          error: error instanceof Error ? error.message : 'GIF generation failed',
          spriteData: sprite
        };
      }
    });
    
    const gifResults = await Promise.all(gifPromises);
    const successfulGIFs = gifResults.filter(result => !result.error);
    const failedGIFs = gifResults.filter(result => result.error);
    
    const totalProcessingTime = Date.now() - startTime;
    
    // Return complete result
    res.json({
      success: true,
      generationId: `gen-${Date.now()}`,
      extractedElements: extraction.visualElements,
      generatedGIFs: successfulGIFs.map(gif => ({
        spriteId: gif.spriteId,
        spriteName: gif.spriteData?.name || 'unknown_sprite',
        gifPath: gif.gifPath,
        downloadUrl: gif.downloadUrl,
        fileSize: gif.fileSize || 0,
        frameCount: gif.frameCount || 0,
        duration: gif.processingTime || 0,
        animationType: gif.animationData?.type || 'unknown'
      })),
      errors: failedGIFs.length > 0 ? failedGIFs : undefined,
      summary: {
        totalGIFs: successfulGIFs.length,
        totalProcessingTime,
        totalFileSize: successfulGIFs.reduce((sum, gif) => sum + (gif.fileSize || 0), 0),
        conversation: {
          messageCount: validatedData.conversation.length,
          visualElementsFound: extraction.spriteDescriptions.length
        }
      }
    });
    
  } catch (error) {
    console.error('Generate GIFs error:', error);
    
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        success: false,
        error: 'Pipeline service error',
        details: error.response?.data?.error || error.message,
        service: error.config?.url?.includes('8091') ? 'visual-extractor' : 
                 error.config?.url?.includes('8093') ? 'gif-generator' : 'unknown'
      });
    }
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request format',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Download generated GIF
 * GET /api/conversation-to-gif/download/:generationId
 */
router.get('/download/:generationId', async (req: Request, res: Response) => {
  try {
    const { generationId } = req.params;
    const format = req.query.format || 'gif';
    
    // Proxy to GIF generator service
    const response = await axios.get(`${SERVICES.gifGenerator}/download/${generationId}`, {
      params: { format },
      responseType: 'stream',
      timeout: 10000
    });
    
    // Set appropriate headers
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/gif');
    res.setHeader('Content-Disposition', response.headers['content-disposition'] || `attachment; filename="${generationId}.gif"`);
    
    // Pipe the response
    response.data.pipe(res);
    
  } catch (error) {
    console.error('Download GIF error:', error);
    
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'GIF not found',
        generationId: req.params.generationId
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Download failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get pipeline status
 * GET /api/conversation-to-gif/status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const serviceChecks = await Promise.allSettled([
      axios.get(`${SERVICES.visualExtractor}/health`, { timeout: 5000 }),
      axios.get(`${SERVICES.gifGenerator}/health`, { timeout: 5000 }),
      axios.get(`${SERVICES.soulFraIntegration}/health`, { timeout: 5000 }),
      axios.get(`${SERVICES.aiOrchestrator}/health`, { timeout: 5000 })
    ]);
    
    const [extractor, gifGenerator, soulFra, aiOrchestrator] = serviceChecks;
    
    res.json({
      success: true,
      pipeline: 'conversation-to-gif',
      services: {
        visualExtractor: {
          status: extractor.status === 'fulfilled' ? 'healthy' : 'unavailable',
          url: SERVICES.visualExtractor,
          lastCheck: new Date().toISOString()
        },
        gifGenerator: {
          status: gifGenerator.status === 'fulfilled' ? 'healthy' : 'unavailable',
          url: SERVICES.gifGenerator,
          lastCheck: new Date().toISOString()
        },
        soulFraIntegration: {
          status: soulFra.status === 'fulfilled' ? 'healthy' : 'unavailable',
          url: SERVICES.soulFraIntegration,
          lastCheck: new Date().toISOString()
        },
        aiOrchestrator: {
          status: aiOrchestrator.status === 'fulfilled' ? 'healthy' : 'unavailable',
          url: SERVICES.aiOrchestrator,
          lastCheck: new Date().toISOString()
        }
      },
      capabilities: [
        'conversation_analysis',
        'visual_element_extraction',
        'sprite_generation',
        'gif_animation',
        'real_time_processing',
        'multi_format_export'
      ]
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Status check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * WebSocket endpoint info
 * GET /api/conversation-to-gif/websocket
 */
router.get('/websocket', (req: Request, res: Response) => {
  res.json({
    success: true,
    websocketEndpoints: {
      conversationAnalysis: 'ws://localhost:8091/conversation-analysis',
      gifGeneration: 'ws://localhost:8093',
      soulFraIntegration: 'ws://localhost:8092',
      platformHub: 'ws://localhost:8081'
    },
    usage: {
      connection: 'Connect to WebSocket endpoints for real-time updates',
      messageFormat: 'JSON messages with type and data fields',
      capabilities: [
        'real_time_conversation_analysis',
        'live_gif_generation_updates',
        'sprite_editor_integration',
        'progress_tracking'
      ]
    },
    documentation: '/API-CONVERSATION-TO-GIF-GUIDE.md'
  });
});

export default router;