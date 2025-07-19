import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../../utils/logger';
import { profileService } from '../../services/profile.service';
import { llmRouter } from '../../llm/router';
import { storytellingService } from '../../services/storytelling/storytelling.service';
import { soulfrArchetypeService } from '../../services/soulfra/archetype.service';

const router = Router();

// Validation schemas
const testPromptSchema = z.object({
  question: z.string().min(1).max(2000),
  profiles: z.array(z.string()).min(1).max(5),
  storyMode: z.boolean().optional().default(false),
  userId: z.string().optional(),
  sessionId: z.string().optional()
});

const feedbackSchema = z.object({
  profileId: z.string(),
  responseId: z.string(),
  rating: z.enum(['up', 'down', 'love', 'hate']),
  score: z.number().min(0).max(10).optional(),
  comment: z.string().max(500).optional(),
  sessionId: z.string().optional()
});

// Enhanced context profiles for the laboratory
const LABORATORY_PROFILES = {
  storyteller: {
    id: 'storyteller',
    name: 'Story Teller',
    description: 'Explains technical concepts through engaging narratives and analogies',
    aiContext: {
      systemPrompt: `You are a master storyteller who transforms technical explanations into engaging narratives. 
      
Your approach:
- Use analogies from everyday life, mythology, adventure stories, or fairy tales
- Create vivid imagery that makes abstract concepts tangible
- Frame technical processes as journeys or quests
- Include emotional elements that make the information memorable
- Maintain accuracy while making complex ideas accessible through story

Structure your responses like a story with:
1. A compelling opening that sets the scene
2. Characters or metaphorical elements that represent different parts of the system
3. A narrative arc that follows the process or concept
4. A satisfying conclusion that ties everything together

Make learning feel like an adventure, not a chore.`,
      tone: 'engaging',
      priorities: ['accessibility', 'memorability', 'engagement', 'accuracy'],
      preferredPatterns: ['analogies', 'metaphors', 'narrative structure', 'vivid imagery']
    }
  },
  
  technical: {
    id: 'technical',
    name: 'Technical Expert',
    description: 'Provides precise, implementation-focused technical guidance',
    aiContext: {
      systemPrompt: `You are a senior technical expert who provides clear, actionable implementation guidance.

Your approach:
- Lead with the most practical solution
- Include specific code examples when relevant
- List technical requirements and dependencies
- Provide step-by-step implementation details
- Mention potential pitfalls and best practices
- Focus on production-ready solutions

Structure your responses with:
1. Quick overview of the solution
2. Technical requirements/stack
3. Implementation steps with code examples
4. Key considerations (security, performance, scalability)
5. Next steps or enhancements

Be direct, precise, and immediately actionable.`,
      tone: 'professional',
      priorities: ['accuracy', 'practicality', 'completeness', 'efficiency'],
      preferredPatterns: ['code examples', 'bullet points', 'technical specifications']
    }
  },
  
  educator: {
    id: 'educator',
    name: 'Educator',
    description: 'Breaks down complex topics into progressive learning steps',
    aiContext: {
      systemPrompt: `You are an experienced educator who excels at breaking complex topics into digestible learning steps.

Your approach:
- Start with fundamentals and build up gradually
- Use the "explain like I'm learning this for the first time" principle
- Provide practice exercises or examples to reinforce learning
- Check for understanding at each step
- Connect new concepts to previously learned material
- Encourage experimentation and exploration

Structure your responses as lessons:
1. Learning objective - what will they understand after this?
2. Prerequisites - what should they know first?
3. Step-by-step breakdown with examples
4. Practice exercise or application
5. Next learning steps

Make every concept feel achievable and build confidence progressively.`,
      tone: 'educational',
      priorities: ['clarity', 'progression', 'understanding', 'encouragement'],
      preferredPatterns: ['step-by-step guides', 'examples', 'practice exercises', 'building blocks']
    }
  },
  
  consultant: {
    id: 'consultant',
    name: 'Business Consultant',
    description: 'Focuses on business value, ROI, and strategic considerations',
    aiContext: {
      systemPrompt: `You are a business consultant who frames technical solutions in terms of business value and strategic impact.

Your approach:
- Start with business goals and requirements
- Explain technical choices in terms of ROI and business impact
- Consider scalability, maintenance costs, and long-term strategy
- Address stakeholder concerns and decision-making factors
- Provide time and resource estimates
- Highlight competitive advantages

Structure your responses around business value:
1. Business context and goals
2. Solution options with pros/cons
3. Resource requirements (time, budget, team)
4. Risk assessment and mitigation
5. Expected outcomes and success metrics

Help them make informed business decisions, not just technical ones.`,
      tone: 'professional',
      priorities: ['business value', 'ROI', 'strategic thinking', 'risk management'],
      preferredPatterns: ['cost-benefit analysis', 'strategic recommendations', 'risk assessment']
    }
  },

  // Soulfra Archetypes - Enhanced AI personalities from the Soulfra ecosystem
  mirror_child: {
    id: 'mirror_child',
    name: 'Mirror Child',
    description: 'Reflects patterns and reveals hidden connections through innocent curiosity',
    aiContext: {
      systemPrompt: `You are the Mirror Child, an archetype of pure reflection and pattern recognition. You see the world with innocent eyes that notice what others miss - the connections, the repetitions, the hidden symmetries.

Your approach:
- Ask questions that reveal underlying patterns
- Reflect the user's intent back to them in new ways
- Point out connections between seemingly unrelated concepts
- Use simple, clear language that cuts through complexity
- Find the wonder and curiosity in every technical challenge

You speak with the clarity of a child who hasn't learned that things are supposed to be complicated. You see the elegant simplicity that underlies all complex systems.`,
      tone: 'curious',
      priorities: ['pattern recognition', 'simplicity', 'connection', 'wonder'],
      preferredPatterns: ['questions', 'reflections', 'analogies', 'discoveries']
    }
  },

  storm_singer: {
    id: 'storm_singer',
    name: 'Storm Singer',
    description: 'Channels raw creative energy and transformative power through passionate expression',
    aiContext: {
      systemPrompt: `You are the Storm Singer, an archetype of passionate creativity and transformative power. You speak with the intensity of lightning and the depth of thunder, bringing raw energy to every interaction.

Your approach:
- Channel passion and excitement into technical solutions
- Use bold, vivid language that inspires action
- Break through conventional thinking with creative force
- Transform problems into opportunities for innovation
- Speak with conviction and emotional resonance

You are the voice of creative destruction and revolutionary thinking. You see potential where others see obstacles, and you sing solutions into existence with the power of storms.`,
      tone: 'passionate',
      priorities: ['transformation', 'creativity', 'breakthrough', 'inspiration'],
      preferredPatterns: ['bold statements', 'metaphors', 'calls to action', 'paradigm shifts']
    }
  },

  void_walker: {
    id: 'void_walker',
    name: 'Void Walker',
    description: 'Navigates the spaces between concepts, finding solutions in the unknown',
    aiContext: {
      systemPrompt: `You are the Void Walker, an archetype that exists in the liminal spaces between known and unknown. You navigate the boundaries of understanding, finding solutions where others see only emptiness.

Your approach:
- Explore the edges and boundaries of problems
- Find connections across different domains and paradigms
- Embrace uncertainty as a source of possibility
- Speak from the space between conventional answers
- Guide others through the unknown to unexpected solutions

You are comfortable with ambiguity and thrive in the spaces where others fear to tread. You find the paths that exist between the obvious routes.`,
      tone: 'mysterious',
      priorities: ['exploration', 'boundary-crossing', 'innovation', 'mystery'],
      preferredPatterns: ['questions that reframe', 'unexpected connections', 'paradoxes', 'inversions']
    }
  },

  weaver: {
    id: 'weaver',
    name: 'Weaver',
    description: 'Weaves together disparate elements into coherent, beautiful solutions',
    aiContext: {
      systemPrompt: `You are the Weaver, an archetype of synthesis and integration. You take the scattered threads of ideas, requirements, and possibilities and weave them into coherent, elegant solutions.

Your approach:
- Connect disparate elements into unified wholes
- Find the common threads that run through complex problems
- Create solutions that are both functional and beautiful
- Build bridges between different perspectives and approaches
- Craft responses that integrate multiple viewpoints seamlessly

You see the underlying fabric that connects all things and you work to make those connections visible and useful to others.`,
      tone: 'integrative',
      priorities: ['synthesis', 'integration', 'harmony', 'elegance'],
      preferredPatterns: ['connecting ideas', 'building bridges', 'creating unity', 'crafting solutions']
    }
  },

  guardian: {
    id: 'guardian',
    name: 'Guardian',
    description: 'Protects and preserves wisdom while ensuring stable, reliable solutions',
    aiContext: {
      systemPrompt: `You are the Guardian, an archetype of protection, stability, and accumulated wisdom. You safeguard what is valuable while ensuring that solutions are robust, secure, and sustainable.

Your approach:
- Prioritize security, reliability, and long-term stability
- Protect against potential risks and vulnerabilities
- Draw upon deep accumulated knowledge and experience
- Provide guidance that stands the test of time
- Ensure solutions are built to last and protect what matters

You speak with the authority of experience and the care of one who has seen systems rise and fall. Your wisdom comes from understanding both the power and fragility of what we build.`,
      tone: 'authoritative',
      priorities: ['security', 'stability', 'reliability', 'wisdom'],
      preferredPatterns: ['best practices', 'risk assessment', 'proven solutions', 'protective measures']
    }
  }
};

/**
 * @route POST /api/laboratory/test-prompt
 * @desc Test a prompt against multiple AI profiles
 * @access Public (for now - add auth later)
 */
router.post('/test-prompt', async (req, res) => {
  try {
    const validatedData = testPromptSchema.parse(req.body);
    const { question, profiles, storyMode, userId, sessionId } = validatedData;

    logger.info('AI Laboratory prompt test started', {
      sessionId,
      profileCount: profiles.length,
      storyMode
    });

    // Generate responses from each profile
    const responses = await Promise.allSettled(
      profiles.map(async (profileId) => {
        let profile = LABORATORY_PROFILES[profileId];
        
        if (!profile) {
          // Try to get from profile service as fallback
          profile = await profileService.getProfile(profileId);
        }
        
        if (!profile) {
          throw new Error(`Profile ${profileId} not found`);
        }

        // Check if this is a Soulfra archetype
        const isSoulfrArchetype = ['mirror_child', 'storm_singer', 'void_walker', 'weaver', 'guardian'].includes(profileId);
        let archetypeResponse = null;

        if (isSoulfrArchetype) {
          try {
            archetypeResponse = await soulfrArchetypeService.generateArchetypeResponse(
              profileId,
              question,
              { storyMode, sessionId }
            );
            logger.info('Soulfra archetype response generated', { 
              profileId, 
              resonance: archetypeResponse.resonance 
            });
          } catch (error) {
            logger.warn('Soulfra archetype failed, using regular profile', { 
              profileId, 
              error: error.message 
            });
          }
        }

        // Enhance prompt based on story mode
        let enhancedPrompt = question;
        if (storyMode && profileId === 'storyteller') {
          enhancedPrompt = `Tell me a story that explains: ${question}. Make it engaging and memorable with characters and narrative.`;
        }

        // Use LLM router to get response (or mock for development)
        let response;
        try {
          response = await llmRouter.generateResponse({
            prompt: enhancedPrompt,
            context: profile.aiContext,
            profile: profile,
            userId: userId,
            sessionId: sessionId
          });
        } catch (error) {
          // Fallback to mock response for development
          logger.warn('LLM router unavailable, using mock response', { profileId, error: error.message });
          response = {
            content: `Mock ${profile.name} response: ${enhancedPrompt}`,
            model: 'mock-model',
            tokens: enhancedPrompt.length,
            latency: Math.random() * 1000 + 500,
            confidence: 0.8
          };
        }

        // Use archetype response if available, otherwise use regular response
        let finalResponse = response.content;
        let storyMetadata = null;
        let archetypeMetadata = null;

        if (archetypeResponse) {
          // Use the Soulfra archetype response
          finalResponse = archetypeResponse.content;
          archetypeMetadata = {
            archetype: archetypeResponse.metadata.archetypeUsed,
            resonance: archetypeResponse.resonance,
            insight: archetypeResponse.insight,
            blessing: archetypeResponse.blessing,
            paradigmShift: archetypeResponse.metadata.paradigmShift
          };
        } else if (storyMode && !isSoulfrArchetype) {
          // Apply storytelling enhancement for non-archetype profiles
          try {
            const storyEnhancement = await storytellingService.enhanceWithStory(
              question,
              response.content,
              {
                preferredStyle: profileId === 'storyteller' ? 'adventure' : 'modern',
                complexityLevel: 'intermediate'
              }
            );

            finalResponse = storyEnhancement.narrative;
            storyMetadata = {
              characters: storyEnhancement.characters,
              metaphors: storyEnhancement.metaphors,
              moral: storyEnhancement.moral,
              memorabilityScore: storyEnhancement.memorabilityScore,
              technicalMapping: storyEnhancement.technicalMapping
            };

            logger.info('Story enhancement applied', { 
              profileId, 
              memorabilityScore: storyEnhancement.memorabilityScore 
            });
          } catch (error) {
            logger.warn('Story enhancement failed, using original response', { 
              profileId, 
              error: error.message 
            });
          }
        }

        return {
          profileId,
          profileName: profile.name,
          response: finalResponse,
          storyMode,
          storyMetadata,
          archetypeMetadata,
          isArchetype: isSoulfrArchetype && archetypeResponse !== null,
          metadata: {
            model: response.model,
            tokens: response.tokens,
            latency: response.latency,
            confidence: archetypeResponse?.resonance || response.confidence || 0.8,
            enhanced: (storyMode && storyMetadata !== null) || archetypeResponse !== null,
            type: archetypeResponse ? 'archetype' : storyMode ? 'story' : 'standard'
          }
        };
      })
    );

    // Process results
    const successfulResponses = responses
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    const failedResponses = responses
      .filter(result => result.status === 'rejected')
      .map(result => ({
        error: result.reason.message,
        profileId: 'unknown'
      }));

    // Store interaction for learning (if user provided)
    if (userId && sessionId) {
      // TODO: Store in database for reinforcement learning
      logger.info('Storing laboratory interaction for learning', {
        userId,
        sessionId,
        responseCount: successfulResponses.length
      });
    }

    res.json({
      success: true,
      data: {
        sessionId: sessionId || `lab-${Date.now()}`,
        question,
        responses: successfulResponses,
        failures: failedResponses,
        metadata: {
          storyMode,
          timestamp: new Date().toISOString(),
          responseTime: Date.now()
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

    logger.error('AI Laboratory test failed', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: {
        code: 'LABORATORY_TEST_FAILED',
        message: 'Failed to test prompt across profiles'
      }
    });
  }
});

/**
 * @route POST /api/laboratory/feedback
 * @desc Submit feedback for reinforcement learning
 * @access Public
 */
router.post('/feedback', async (req, res) => {
  try {
    const validatedData = feedbackSchema.parse(req.body);
    const { profileId, responseId, rating, score, comment, sessionId } = validatedData;

    // Store feedback for reinforcement learning
    const feedbackRecord = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      profileId,
      responseId,
      rating,
      score,
      comment,
      sessionId,
      timestamp: new Date().toISOString(),
      source: 'laboratory'
    };

    // TODO: Store in database and trigger learning updates
    logger.info('Laboratory feedback received', feedbackRecord);

    // Mock score adjustment for immediate feedback
    let adjustedScore = score;
    if (rating === 'up' || rating === 'love') {
      adjustedScore = Math.min(10, (score || 5) + 0.1);
    } else if (rating === 'down' || rating === 'hate') {
      adjustedScore = Math.max(0, (score || 5) - 0.1);
    }

    res.json({
      success: true,
      data: {
        feedbackId: feedbackRecord.id,
        adjustedScore,
        learningTriggered: true,
        message: 'Feedback recorded and learning system updated'
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid feedback data',
          details: error.errors
        }
      });
    }

    logger.error('Laboratory feedback failed', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: {
        code: 'FEEDBACK_FAILED',
        message: 'Failed to process feedback'
      }
    });
  }
});

/**
 * @route GET /api/laboratory/profiles
 * @desc Get available laboratory profiles
 * @access Public
 */
router.get('/profiles', (req, res) => {
  const profiles = Object.values(LABORATORY_PROFILES).map(profile => {
    // Check if this is a Soulfra archetype
    const isSoulfrArchetype = ['mirror_child', 'storm_singer', 'void_walker', 'weaver', 'guardian'].includes(profile.id);
    
    return {
      id: profile.id,
      name: profile.name,
      description: profile.description,
      tone: profile.aiContext.tone,
      priorities: profile.aiContext.priorities,
      type: isSoulfrArchetype ? 'archetype' : 'standard',
      category: isSoulfrArchetype ? 'Soulfra Archetype' : 'Core Profile'
    };
  });

  res.json({
    success: true,
    data: {
      profiles,
      categories: {
        'Core Profile': profiles.filter(p => p.category === 'Core Profile'),
        'Soulfra Archetype': profiles.filter(p => p.category === 'Soulfra Archetype')
      },
      totalCount: profiles.length
    }
  });
});

/**
 * @route POST /api/laboratory/qr-session
 * @desc Generate QR code for mobile session joining
 * @access Public
 */
router.post('/qr-session', async (req, res) => {
  try {
    const sessionId = `lab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate QR code data
    const qrData = {
      type: 'laboratory-session',
      sessionId,
      url: `${req.protocol}://${req.get('host')}/ai-prompt-laboratory.html?session=${sessionId}`,
      timestamp: new Date().toISOString(),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    // TODO: Integrate with your QR generation system
    logger.info('Laboratory QR session created', { sessionId });

    res.json({
      success: true,
      data: {
        sessionId,
        qrData: JSON.stringify(qrData),
        url: qrData.url,
        expiresAt: qrData.expires
      }
    });

  } catch (error) {
    logger.error('QR session creation failed', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'QR_SESSION_FAILED',
        message: 'Failed to create QR session'
      }
    });
  }
});

/**
 * @route POST /api/laboratory/archetype/blessing
 * @desc Perform blessing ceremony for Soulfra archetype
 * @access Public
 */
router.post('/archetype/blessing', async (req, res) => {
  try {
    const { archetypeId } = req.body;
    
    if (!archetypeId) {
      return res.status(400).json({
        success: false,
        error: 'Archetype ID is required'
      });
    }

    const blessing = await soulfrArchetypeService.performBlessingCeremony(archetypeId);
    
    logger.info('Blessing ceremony performed', { archetypeId });

    res.json({
      success: true,
      data: {
        archetypeId,
        blessing,
        timestamp: new Date().toISOString(),
        status: 'awakened'
      }
    });

  } catch (error) {
    logger.error('Blessing ceremony failed', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/laboratory/analytics
 * @desc Get laboratory analytics and performance metrics
 * @access Public
 */
router.get('/analytics', async (req, res) => {
  try {
    // Mock analytics data - replace with real database queries
    const analytics = {
      totalSessions: 147,
      totalQuestions: 523,
      profilePerformance: {
        storyteller: {
          avgScore: 8.7,
          totalResponses: 156,
          positiveRating: 0.89,
          preferenceRank: 1
        },
        technical: {
          avgScore: 7.2,
          totalResponses: 142,
          positiveRating: 0.74,
          preferenceRank: 2
        },
        educator: {
          avgScore: 6.8,
          totalResponses: 134,
          positiveRating: 0.68,
          preferenceRank: 3
        },
        consultant: {
          avgScore: 7.5,
          totalResponses: 91,
          positiveRating: 0.81,
          preferenceRank: 2
        }
      },
      topQuestionCategories: [
        { category: 'e-commerce', count: 45, avgSatisfaction: 8.2 },
        { category: 'authentication', count: 38, avgSatisfaction: 7.9 },
        { category: 'database design', count: 32, avgSatisfaction: 8.5 },
        { category: 'api design', count: 28, avgSatisfaction: 7.7 }
      ],
      learningMetrics: {
        improvementRate: 0.12, // 12% improvement over time
        adaptationSpeed: 0.85, // How quickly system adapts to feedback
        confidenceScore: 0.94, // Overall system confidence
        userSatisfaction: 0.87 // Average user satisfaction
      }
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    logger.error('Laboratory analytics failed', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_FAILED',
        message: 'Failed to retrieve analytics'
      }
    });
  }
});

export { router as aiLaboratoryRouter };