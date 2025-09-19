"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiConductorRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const logger_1 = require("../../../utils/logger");
const ai_conductor_integration_1 = require("../../../services/conductor/ai-conductor.integration");
const router = (0, express_1.Router)();
exports.aiConductorRouter = router;
const ingestConversationSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(10000),
    source: zod_1.z.enum(['claude', 'gpt4', 'gemini', 'local']),
    threadId: zod_1.z.string(),
    userId: zod_1.z.string().optional(),
    metadata: zod_1.z.any().optional()
});
const thoughtChainSchema = zod_1.z.object({
    goal: zod_1.z.string().min(1).max(1000),
    context: zod_1.z.string().max(5000).optional().default(''),
    maxDepth: zod_1.z.number().min(1).max(10).default(5),
    userId: zod_1.z.string().optional()
});
const orchestrateProjectSchema = zod_1.z.object({
    projectId: zod_1.z.string().min(1)
});
router.post('/start', async (req, res) => {
    try {
        logger_1.logger.info('Starting AI Conductor via API request');
        await ai_conductor_integration_1.aiConductorIntegration.startConductor();
        res.json({
            success: true,
            message: 'AI Conductor started successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start AI Conductor', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'CONDUCTOR_START_FAILED',
                message: error.message
            }
        });
    }
});
router.post('/stop', async (req, res) => {
    try {
        logger_1.logger.info('Stopping AI Conductor via API request');
        await ai_conductor_integration_1.aiConductorIntegration.stopConductor();
        res.json({
            success: true,
            message: 'AI Conductor stopped successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to stop AI Conductor', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'CONDUCTOR_STOP_FAILED',
                message: error.message
            }
        });
    }
});
router.get('/status', async (req, res) => {
    try {
        const status = await ai_conductor_integration_1.aiConductorIntegration.getConductorStatus();
        res.json({
            success: true,
            data: status
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get conductor status', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'CONDUCTOR_STATUS_FAILED',
                message: 'Failed to get conductor status'
            }
        });
    }
});
router.post('/ingest', async (req, res) => {
    try {
        const validatedData = ingestConversationSchema.parse(req.body);
        await ai_conductor_integration_1.aiConductorIntegration.ingestConversation(validatedData);
        logger_1.logger.info('Conversation ingested successfully', {
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.errors
                }
            });
        }
        logger_1.logger.error('Failed to ingest conversation', { error, body: req.body });
        res.status(500).json({
            success: false,
            error: {
                code: 'INGEST_FAILED',
                message: error.message
            }
        });
    }
});
router.post('/thought-chain', async (req, res) => {
    try {
        const validatedData = thoughtChainSchema.parse(req.body);
        const thoughtChain = await ai_conductor_integration_1.aiConductorIntegration.generateThoughtChain(validatedData);
        logger_1.logger.info('Thought chain generated successfully', {
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.errors
                }
            });
        }
        logger_1.logger.error('Failed to generate thought chain', { error, body: req.body });
        res.status(500).json({
            success: false,
            error: {
                code: 'THOUGHT_CHAIN_FAILED',
                message: error.message
            }
        });
    }
});
router.get('/builders', async (req, res) => {
    try {
        const builders = await ai_conductor_integration_1.aiConductorIntegration.getAIBuilders();
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
    }
    catch (error) {
        logger_1.logger.error('Failed to get AI builders', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'BUILDERS_FAILED',
                message: error.message
            }
        });
    }
});
router.post('/orchestrate', async (req, res) => {
    try {
        const validatedData = orchestrateProjectSchema.parse(req.body);
        const result = await ai_conductor_integration_1.aiConductorIntegration.orchestrateProject(validatedData.projectId);
        logger_1.logger.info('Project orchestrated successfully', {
            projectId: validatedData.projectId,
            assignmentCount: Object.keys(result.assignments).length
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.errors
                }
            });
        }
        logger_1.logger.error('Failed to orchestrate project', { error, body: req.body });
        res.status(500).json({
            success: false,
            error: {
                code: 'ORCHESTRATION_FAILED',
                message: error.message
            }
        });
    }
});
router.get('/projects', async (req, res) => {
    try {
        const projects = await ai_conductor_integration_1.aiConductorIntegration.getProjectStates();
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
    }
    catch (error) {
        logger_1.logger.error('Failed to get project states', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'PROJECTS_FAILED',
                message: error.message
            }
        });
    }
});
router.post('/laboratory/integrate', async (req, res) => {
    try {
        const { sessionId, question, responses, storyMode } = req.body;
        if (!sessionId || !question || !responses) {
            return res.status(400).json({
                success: false,
                error: 'sessionId, question, and responses are required'
            });
        }
        await ai_conductor_integration_1.aiConductorIntegration.ingestConversation({
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
        const thoughtChain = await ai_conductor_integration_1.aiConductorIntegration.generateThoughtChain({
            goal: `Optimize AI responses for: ${question}`,
            context: `Laboratory session with ${responses.length} different AI profiles. Story mode: ${storyMode}`,
            maxDepth: 3
        });
        logger_1.logger.info('Laboratory session integrated with Conductor', {
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
    }
    catch (error) {
        logger_1.logger.error('Failed to integrate laboratory session', { error, body: req.body });
        res.status(500).json({
            success: false,
            error: {
                code: 'INTEGRATION_FAILED',
                message: error.message
            }
        });
    }
});
//# sourceMappingURL=ai-conductor.route.js.map